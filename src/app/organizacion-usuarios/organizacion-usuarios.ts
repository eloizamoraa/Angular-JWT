import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { Organizacion } from '../models/organizacion.model';
import { Usuario } from '../models/usuario.model';

@Component({
  selector: 'app-organizacion-usuarios',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organizacion-usuarios.html',
  styleUrls: ['./organizacion-usuarios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizacionUsuariosComponent {
  readonly organizacion = input.required<Organizacion>();
  readonly todosUsuarios = input<Usuario[]>([]);

  readonly anadir = output<string>();
  readonly eliminar = output<string>();

  readonly usuarioSeleccionado = new FormControl('');

  readonly usuariosEnOrganizacion = computed(() => this.organizacion().users ?? []);

  readonly usuariosDisponibles = computed(() => {
    const idsEnOrganizacion = new Set(this.usuariosEnOrganizacion().map((user) => user._id));
    return this.todosUsuarios().filter((user) => !idsEnOrganizacion.has(user._id));
  });

  agregarUsuario(): void {
    const userId = this.usuarioSeleccionado.value;

    if (!userId) {
      return;
    }

    this.anadir.emit(userId);
    this.usuarioSeleccionado.setValue('');
  }

  quitarUsuario(userId: string): void {
    this.eliminar.emit(userId);
  }
}
