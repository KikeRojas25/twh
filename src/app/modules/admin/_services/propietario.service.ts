import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Cliente, Grupo } from '../facturacion/cliente.type';

const httpOptions = {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class PropietarioService {

  private readonly baseUrl = environment.baseUrl + '/api/propietarios';
  private readonly _httpClient = inject(HttpClient);

  constructor() { }

  /**
   * 🔹 Obtener todos los propietarios o filtrarlos por grupo
   * Endpoint: GET /api/propietarios?idGrupo={idGrupo}&usuarioId={usuarioId}
   */
  getAllPropietarios(idGrupo?: number): Observable<Cliente[]> {
    const qs = new URLSearchParams();
    if (idGrupo !== undefined && idGrupo !== null) {
      qs.set('idGrupo', String(idGrupo));
    }

    const usuarioId = this.getUsuarioIdFromToken();
    if (usuarioId) {
      qs.set('usuarioId', usuarioId);
    }

    const url = qs.toString() ? `${this.baseUrl}?${qs.toString()}` : `${this.baseUrl}`;
    return this._httpClient.get<Cliente[]>(url, httpOptions);
  }

  private getUsuarioIdFromToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const jsonPayload = decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      const val = payload?.nameid ?? payload?.NameId ?? payload?.usuarioId ?? payload?.UsuarioId ?? null;
      if (val === null || val === undefined) return null;
      return String(val);
    } catch {
      return null;
    }
  }

  /**
   * 🔹 Obtener propietarios asociados a un usuario
   * Endpoint: GET /api/propietarios/usuarios/{idUsuario}
   */
  getPropietariosByUsuario(idUsuario: number): Observable<Cliente[]> {
    const url = `${this.baseUrl}/usuarios/${idUsuario}`;
    return this._httpClient.get<Cliente[]>(url, httpOptions);
  }

  /**
   * 🔹 Obtener un propietario por Id
   * Endpoint: GET /api/propietarios/{id}
   */
  getPropietarioById(id: number): Observable<Cliente> {
    const url = `${this.baseUrl}/${id}`;
    return this._httpClient.get<Cliente>(url, httpOptions);
  }

  /**
   * 🔹 Obtener todos los grupos (si aplica)
   * Endpoint: GET /api/grupos
   */
  getAllGrupos(): Observable<Grupo[]> {
    const url = `${environment.baseUrl}/api/grupos`;
    return this._httpClient.get<Grupo[]>(url, httpOptions);
  }
}
