import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../models/usuario.model';
import { Organizacion } from '../models/organizacion.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { Subscription } from 'rxjs';

import { PresenciaService } from '../services/presencia.service';


@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './usuario-list.html',
  styleUrls: ['./usuario-list.css'],
})
export class UsuarioList implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  organizaciones: Organizacion[] = [];
  usuariosFiltrados: Usuario[] = [];
  searchControl = new FormControl('');
  loading = false;
  errorMsg = '';
  mostrarForm = false;
  usuarioForm!: FormGroup;
  editando = false;
  usuarioEditId: string | null = null;
  expanded: { [key: string]: boolean } = {};
  limite = 10;
  mostrarTodosUsuarios = false;
  currentSessionUserId: string | null = null;
  presenceConnected = false;
  connectedUsersCount = 0;
  activeConnectionsCount = 0;

  private readonly activeUserIds = new Set<string>();
  private readonly subscriptions = new Subscription();
  private readonly isBrowser: boolean;

  constructor(
    private api: UsuarioService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private presencia: PresenciaService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.usuarioForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      organizacion: ['', Validators.required],
    });

    this.searchControl = new FormControl('');

  }

  // Función para validar que las contraseñas son idénticas
  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    // Solo validamos si ambos campos tienen algo escrito
    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  //Función: leer
  ngOnInit(): void {
    this.load();
    this.loadOrganizaciones();
    if (this.isBrowser) {
      this.currentSessionUserId = localStorage.getItem('presenceUserId');
    }

    this.subscriptions.add(
      this.presencia.activeUserIds$.subscribe((ids) => {
        this.activeUserIds.clear();
        ids.forEach((id) => this.activeUserIds.add(id));
      }),
    );

    this.subscriptions.add(
      this.presencia.isConnected$.subscribe((isConnected) => {
        this.presenceConnected = isConnected;
      }),
    );

    this.subscriptions.add(
      this.presencia.connectedCount$.subscribe((count) => {
        this.connectedUsersCount = count;
      }),
    );

    this.subscriptions.add(
      this.presencia.connectionsCount$.subscribe((count) => {
        this.activeConnectionsCount = count;
      }),
    );
    
    this.subscriptions.add(
      this.searchControl.valueChanges.subscribe((value) => {
        const term = value?.toLowerCase() ?? '';

        this.usuariosFiltrados = this.usuarios.filter((org) =>
          org.name.toLowerCase().includes(term),
        );
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.isBrowser) {
      this.presencia.disconnect();
    }
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.api.getUsuarios().subscribe({
      next: (res) => {
        this.usuarios = res;
        this.usuariosFiltrados = [...this.usuarios];
        this.ensurePresenceConnection();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se han podido cargar los usuarios.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  //Función: trackBy para optimizar el ngFor
  trackById(_index: number, u: Usuario): string {
    return u._id;
  }

  isActive(userId: string): boolean {
    return this.activeUserIds.has(userId);
  }

  selectSessionUser(userId: string): void {
    if (!userId || !this.isBrowser) {
      return;
    }

    const selectedUser = this.usuarios.find((user) => user._id === userId);
    const username = selectedUser?.name?.trim() || userId;

    this.currentSessionUserId = userId;
    localStorage.setItem('presenceUserId', userId);
    this.presencia.connect(userId, username);
  }

  private ensurePresenceConnection(): void {
    if (!this.usuarios.length || !this.isBrowser) {
      return;
    }

    const selectedId = this.currentSessionUserId;
    const selectedExists =
      !!selectedId && this.usuarios.some((user) => user._id === selectedId);

    const userIdToConnect = selectedExists ? selectedId : this.usuarios[0]._id;
    this.selectSessionUser(userIdToConnect);
  }

  //Función: obtener nombre de organización para mostrar en la tabla
  organizacionLabel(u: Usuario): string {
    const org = u.organizacion;
    if (!org) return '-';
    if (typeof org === 'string') return org; 
    return (org as Organizacion).name ?? '-';
  }

  //Función: mostrar formulario
   mostrarFormulario(): void {
  this.mostrarForm = true;
}

//Función: cargar organizaciones para el select del formulario
loadOrganizaciones(): void {
  this.api.getOrganizaciones().subscribe({
    next: (res) => {
      this.organizaciones = res;
    },
    error: (err) => console.error(err)
  });
}

//Función: mostrar más
  mostrarMas(): void {
  this.mostrarTodosUsuarios = true;
  } 

  get usuariosVisibles(): Usuario[] {
    if (this.mostrarTodosUsuarios) {
      return this.usuariosFiltrados;
    }
    return this.usuariosFiltrados.slice(0, this.limite);
  }
  
  //Función: guardar (tanto para crear como para actualizar)
guardar(): void {
  
  if (this.usuarioForm.invalid) return;

  const { name, email, password, organizacion } = this.usuarioForm.value;

  if (this.editando && this.usuarioEditId) {
    // UPDATE: pasamos id, name, email, password, organizacion
    this.api.updateUsuario(this.usuarioEditId, name, email, password, organizacion)
      .subscribe({
        next: () => {
          this.resetForm();
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se ha podido actualizar el usuario.';
        }
      });

  } else {

    // CREATE: pasamos name, email, password, organizacion
    this.api.createUsuario(name, email, password, organizacion)
      .subscribe({
        next: () => {
          this.resetForm();
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se ha podido crear el usuario.';
        }
      });
  }
}

//Función: expandir fila para mostrar detalles
toggleExpand(id: string): void {
  this.expanded[id] = !this.expanded[id];
}

//Función: confirmar eliminación de usuario
  confirmDelete(id: string, name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.delete(id);
      }
    });
  }

  //Función: editar usuario (muestra el formulario con los datos cargados)
editar(user: Usuario): void {
  this.mostrarForm = true;
  this.editando = true;
  this.usuarioEditId = user._id;

  this.usuarioForm.patchValue({
    name: user.name,
    organizacion: typeof user.organizacion === 'string'
      ? user.organizacion
      : (user.organizacion as Organizacion)?._id
  });
}
//Función: resetear formulario
resetForm(): void {
  this.mostrarForm = false;
  this.editando = false;
  this.usuarioEditId = null;
  this.usuarioForm.reset();
}

//Función: eliminar usuario
  delete(id: string): void {
    this.errorMsg = '';
    this.loading = true;

    this.api.deleteUsuario(id).subscribe({
      next: () => {
        this.load();
      },
      error: () => {
        this.errorMsg = 'Error delete';
        this.loading = false;
      }
    });
  }
}
