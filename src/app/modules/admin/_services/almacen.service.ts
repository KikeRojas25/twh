import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { Almacen } from '../_models/almacen';



const httpOptions = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
    'Content-Type' : 'application/json'
  })
  // , observe: 'body', reportProgress: true };
};



@Injectable({
  providedIn: 'root'
})
export class AlmacenService {

  private baseUrl = environment.baseUrl + '/api/Almacen/';
  private _httpClient = inject(HttpClient);

constructor() { }



getAllAlmacenes(): Observable<Almacen[]> {
  return this._httpClient.get<Almacen[]>(`${this.baseUrl}GetAlmacenes`)
    .pipe(
      catchError(this.handleError)  // Manejo de errores
    );
}



 // Método para manejar errores de la solicitud HTTP
 private handleError(error: HttpErrorResponse) {
  let errorMessage = 'Ocurrió un error desconocido.';
  if (error.error instanceof ErrorEvent) {
    // Error del lado del cliente
    errorMessage = `Error: ${error.error.message}`;
  } else {
    // Error del lado del servidor
    errorMessage = `Código del error: ${error.status}\nMensaje: ${error.message}`;
  }
  console.error(errorMessage);
  return throwError(() => new Error(errorMessage));
}
}
