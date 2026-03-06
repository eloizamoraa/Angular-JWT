import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';
import { Organizacion } from '../models/organizacion.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}
  
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(
      `${this.baseUrl}/usuarios`
    );
  }

  getOrganizaciones(): Observable<Organizacion[]> {
    return this.http.get<Organizacion[]>(
      `${this.baseUrl}/organizaciones`
    );
  }



  getUsuarioById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${this.baseUrl}/usuarios/${id}`
    );
  }

  createUsuario(name: string, email: string, password: string, organizacion: string): Observable<Usuario> {
    return this.http.post<Usuario>(
      `${this.baseUrl}/usuarios`,
      { name, email, password, organizacion }
    );
  }

  updateUsuario(id: string, name: string, email: string, password: string, organizacion: string): Observable<Usuario> {
    return this.http.put<Usuario>(
      `${this.baseUrl}/usuarios/${id}`,
      { name, email, password, organizacion } 
    );
  }

  deleteUsuario(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/usuarios/${id}`
    );
  }
}
