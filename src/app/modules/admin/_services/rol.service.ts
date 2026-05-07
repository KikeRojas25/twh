import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { Rol, RolForUpsert, Pagina, RolPagina } from '../_models/rol';

const httpOptions = {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json',
  }),
};

@Injectable({
  providedIn: 'root'
})
export class RolService {

  private baseUrl = environment.baseUrl + '/api/Roles';
  private _httpClient = inject(HttpClient);

  /** Lista roles. Por defecto solo activos. Pasar incluirInactivos=true para listar todos. */
  getAllRoles(incluirInactivos: boolean = false): Observable<Rol[]> {
    const url = `${this.baseUrl}${incluirInactivos ? '?incluirInactivos=true' : ''}`;
    return this._httpClient.get<Rol[]>(url, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getRolById(id: number): Observable<Rol> {
    return this._httpClient.get<Rol>(`${this.baseUrl}/${id}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  crearRol(dto: RolForUpsert): Observable<Rol> {
    return this._httpClient.post<Rol>(`${this.baseUrl}/register`, dto, httpOptions)
      .pipe(catchError(this.handleError));
  }

  actualizarRol(id: number, dto: RolForUpsert): Observable<Rol> {
    return this._httpClient.put<Rol>(`${this.baseUrl}/${id}`, dto, httpOptions)
      .pipe(catchError(this.handleError));
  }

  toggleActivo(id: number): Observable<Rol> {
    return this._httpClient.patch<Rol>(`${this.baseUrl}/${id}/toggle-activo`, {}, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /** Catálogo completo de páginas (pantallas/menús del sistema). */
  getPaginas(): Observable<Pagina[]> {
    return this._httpClient.get<Pagina[]>(`${this.baseUrl}/paginas`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /** Páginas asignadas al rol. */
  getPaginasByRol(rolId: number): Observable<RolPagina[]> {
    return this._httpClient.get<RolPagina[]>(`${this.baseUrl}/${rolId}/paginas`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /** Reemplaza completamente las páginas asignadas a un rol. */
  saveRolPaginas(rolId: number, seleccion: RolPagina[]): Observable<RolPagina[]> {
    return this._httpClient.post<RolPagina[]>(`${this.baseUrl}/${rolId}/paginas`, seleccion, httpOptions)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código del error: ${error.status}\nMensaje: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => error);
  }
}
