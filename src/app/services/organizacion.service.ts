import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organizacion } from '../models/organizacion.model';
import { environment } from '../../environments/environment';



@Injectable({
  providedIn: 'root',
})
export class OrganizacionService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOrganizaciones(): Observable<Organizacion[]> {
    return this.http.get<Organizacion[]>(
      `${this.baseUrl}/organizaciones`
    );
  }

  getOrganizacionById(id: string): Observable<Organizacion> {
    return this.http.get<Organizacion>(
      `${this.baseUrl}/organizaciones/${id}`
    );
  }

  createOrganizacion(name: string): Observable<Organizacion> {
    return this.http.post<Organizacion>(
      `${this.baseUrl}/organizaciones`,
      { name }
    );
  }

  updateOrganizacion(id: string, name: string): Observable<Organizacion> {
    return this.http.put<Organizacion>(
      `${this.baseUrl}/organizaciones/${id}`,
      { name }
    );
  }

  deleteOrganizacion(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/organizaciones/${id}`
    );
  }
}
