import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Socket, io } from 'socket.io-client';

import { environment } from '../../environments/environment';

type PresenceUser = string | { _id?: string; id?: string; userId?: string };

interface PresenceUpdatePayload {
  activeUserIds?: string[];
  users?: PresenceUser[];
  onlineUsers?: PresenceUser[];
  totalUsers?: number;
  total?: number;
  connectedCount?: number;
  totalConnections?: number;
}

interface PresenceStatsPayload {
  totalUsers?: number;
  totalConnections?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PresenciaService implements OnDestroy {
  private socket?: Socket;
  private connectedUserId: string | null = null;
  private connectedUsername: string | null = null;

  private readonly activeUserIdsSubject = new BehaviorSubject<string[]>([]);
  private readonly activeUsersCountSubject = new BehaviorSubject<number>(0);
  private readonly isConnectedSubject = new BehaviorSubject<boolean>(false);
  private readonly connectionsCountSubject = new BehaviorSubject<number>(0);
  private readonly debug = true;

  readonly activeUserIds$: Observable<string[]> =
    this.activeUserIdsSubject.asObservable();
  readonly activeUsersCount$: Observable<number> =
    this.activeUsersCountSubject.asObservable();
  readonly isConnected$: Observable<boolean> =
    this.isConnectedSubject.asObservable();
  readonly connectedCount$: Observable<number> = this.activeUsersCount$;
  readonly connectionsCount$: Observable<number> =
    this.connectionsCountSubject.asObservable();

  connect(userId: string, username: string): void {
    if (!userId || !username) {
      return;
    }

    if (
      this.socket &&
      this.socket.connected &&
      this.connectedUserId === userId &&
      this.connectedUsername === username
    ) {
      return;
    }

    this.disconnect(false);
    this.connectedUserId = userId;
    this.connectedUsername = username;

    this.socket = io(environment.socketUrl, {
      auth: { userId, username },
      query: { userId, username },
    });

    this.socket.onAny((eventName, payload) => {
      if (!this.debug) {
        return;
      }

      console.log('[presence] incoming event:', eventName, payload);
    });

    this.socket.on('connect', () => {
      if (this.debug) {
        console.log('[presence] connected', {
          socketId: this.socket?.id,
          userId,
          username,
          url: environment.socketUrl,
        });
      }

      this.isConnectedSubject.next(true);
      this.emitJoinEvents(userId, username);
      this.requestPresenceState(userId, username);
    });

    this.socket.on('disconnect', () => {
      if (this.debug) {
        console.log('[presence] disconnected');
      }

      this.isConnectedSubject.next(false);
    });

    const handlePresenceUpdate = (payload: PresenceUpdatePayload | PresenceUser[]) => {
      this.applyPresencePayload(payload);
    };

    this.socket.on('presence:update', handlePresenceUpdate);
    this.socket.on('presence:list', handlePresenceUpdate);
    this.socket.on('presence:state', handlePresenceUpdate);
    this.socket.on('users:active', handlePresenceUpdate);
    this.socket.on('users:online', handlePresenceUpdate);
    this.socket.on('users:updated', handlePresenceUpdate);
    this.socket.on('users:update', handlePresenceUpdate);
    this.socket.on('online-users', handlePresenceUpdate);
    this.socket.on('presence:stats', (payload: PresenceStatsPayload) => {
      if (typeof payload?.totalUsers === 'number') {
        this.activeUsersCountSubject.next(payload.totalUsers);
      }

      if (typeof payload?.totalConnections === 'number') {
        this.connectionsCountSubject.next(payload.totalConnections);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnectedSubject.next(false);
    });

    this.socket.on('error', (error) => {
      console.error('Socket runtime error:', error);
    });
  }

  disconnect(resetState = true): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }

    this.connectedUserId = null;
    this.connectedUsername = null;
    this.activeUsersCountSubject.next(0);
    this.isConnectedSubject.next(false);
    this.connectionsCountSubject.next(0);

    if (resetState) {
      this.activeUserIdsSubject.next([]);
    }
  }

  private emitJoinEvents(userId: string, username: string): void {
    if (!this.socket) {
      return;
    }

    const payload = { userId, username };

    // Compatibility with backends that use explicit join/identify events.
    this.socket.emit('presence:join', payload);
    this.socket.emit('presence:join', userId);
    this.socket.emit('join', payload);
    this.socket.emit('join', userId);
    this.socket.emit('user:join', payload);
    this.socket.emit('user:join', userId);
    this.socket.emit('identify', payload);
    this.socket.emit('identify', userId);
    this.socket.emit('user_connected', payload);
    this.socket.emit('user_connected', userId);
    this.socket.emit('user:connected', payload);
    this.socket.emit('user:connected', userId);
    this.socket.emit('set-user', payload);
    this.socket.emit('set-user', userId);
    this.socket.emit('setUser', payload);
    this.socket.emit('setUser', userId);
    this.socket.emit('register', payload);
    this.socket.emit('register', userId);
    this.socket.emit('register-user', payload);
    this.socket.emit('register-user', userId);
  }

  private requestPresenceState(userId: string, username: string): void {
    if (!this.socket) {
      return;
    }

    const payload = { userId, username };

    // Some backends broadcast only after an explicit state request.
    this.socket.emit('presence:get', payload);
    this.socket.emit('presence:get', userId);
    this.socket.emit('presence:request', payload);
    this.socket.emit('presence:request', userId);
    this.socket.emit('users:online:get', payload);
    this.socket.emit('users:online:get', userId);
  }

  private applyPresencePayload(payload: PresenceUpdatePayload | PresenceUser[]): void {
    const normalized = this.normalizePayload(payload);

    this.activeUserIdsSubject.next(normalized.activeUserIds);
    this.activeUsersCountSubject.next(normalized.activeUsersCount);

    const connectionsCount =
      normalized.connectionsCount ?? normalized.activeUserIds.length;
    this.connectionsCountSubject.next(connectionsCount);
  }

  private normalizePayload(
    payload: PresenceUpdatePayload | PresenceUser[],
  ): {
    activeUserIds: string[];
    activeUsersCount: number;
    connectionsCount?: number;
  } {
    if (Array.isArray(payload)) {
      const activeUserIds = this.extractIds(payload);
      return { activeUserIds, activeUsersCount: activeUserIds.length };
    }

    const sourceList =
      payload.activeUserIds ??
      payload.users ??
      payload.onlineUsers ??
      [];

    const activeUserIds = this.extractIds(sourceList);

    return {
      activeUserIds,
      activeUsersCount: payload.totalUsers ?? activeUserIds.length,
      connectionsCount:
        payload.totalConnections ?? payload.connectedCount ?? payload.total,
    };
  }

  private extractIds(users: PresenceUser[]): string[] {
    const ids = users
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }

        return entry.userId ?? entry._id ?? entry.id ?? '';
      })
      .filter((id) => !!id);

    return Array.from(new Set(ids));
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.activeUserIdsSubject.complete();
    this.activeUsersCountSubject.complete();
    this.isConnectedSubject.complete();
    this.connectionsCountSubject.complete();
  }
}
