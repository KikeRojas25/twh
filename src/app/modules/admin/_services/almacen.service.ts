import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { Almacen, AlmacenForUpsert } from '../_models/almacen';



const httpOptions = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
    'Content-Type' : 'application/json'
  })
};



@Injectable({
  providedIn: 'root'
})
export class AlmacenService {

  private baseUrl = environment.baseUrl + '/api/Almacen';
  private _httpClient = inject(HttpClient);

constructor() { }


/** Lista almacenes. Por defecto solo activos. Pasar incluirInactivos=true para listar todos. */
getAllAlmacenes(incluirInactivos: boolean = false): Observable<Almacen[]> {
  const url = `${this.baseUrl}/GetAlmacenes${incluirInactivos ? '?incluirInactivos=true' : ''}`;
  return this._httpClient.get<Almacen[]>(url, httpOptions)
    .pipe(catchError(this.handleError));
}

/** Solo activos que tienen ubicaciones registradas (consumido por dashboard). */
getAlmacenesActivos(): Observable<Almacen[]> {
  return this._httpClient.get<Almacen[]>(`${this.baseUrl}/GetAlmacenesActivos`, httpOptions)
    .pipe(catchError(this.handleError));
}

getAlmacenById(id: number): Observable<Almacen> {
  return this._httpClient.get<Almacen>(`${this.baseUrl}/${id}`, httpOptions)
    .pipe(catchError(this.handleError));
}

crearAlmacen(dto: AlmacenForUpsert): Observable<Almacen> {
  return this._httpClient.post<Almacen>(`${this.baseUrl}`, dto, httpOptions)
    .pipe(catchError(this.handleError));
}

actualizarAlmacen(id: number, dto: AlmacenForUpsert): Observable<Almacen> {
  return this._httpClient.put<Almacen>(`${this.baseUrl}/${id}`, dto, httpOptions)
    .pipe(catchError(this.handleError));
}

toggleActivo(id: number): Observable<Almacen> {
  return this._httpClient.patch<Almacen>(`${this.baseUrl}/${id}/toggle-activo`, {}, httpOptions)
    .pipe(catchError(this.handleError));
}


 // Método para manejar errores de la solicitud HTTP
 private handleError(error: HttpErrorResponse) {
  let errorMessage = 'Ocurrió un error desconocido.';
  if (error.error instanceof ErrorEvent) {
    errorMessage = `Error: ${error.error.message}`;
  } else {
    errorMessage = `Código del error: ${error.status}\nMensaje: ${error.message}`;
  }
  console.error(errorMessage);
  return throwError(() => new Error(errorMessage));
}
}
