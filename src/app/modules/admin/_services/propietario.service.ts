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
   * Endpoint: GET /api/propietarios?idGrupo={idGrupo}
   */
  getAllPropietarios(idGrupo?: number): Observable<Cliente[]> {
    const url = idGrupo
      ? `${this.baseUrl}?idGrupo=${idGrupo}`
      : `${this.baseUrl}`;
    return this._httpClient.get<Cliente[]>(url, httpOptions);
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
