import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { tarifario } from './transporte.types';



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
export class TransporteService {

    private _httpClient = inject(HttpClient);
    private baseUrl = environment.baseUrl + '/api/cliente/';
    private baseUrlVehiculo = environment.baseUrl + '/api/vehiculo/';
    private baseUrlProveedor = environment.baseUrl + '/api/proveedor/';

    private baseUrlMantenimiento = environment.baseUrl + '/api/general/';
    private baseUrlTarifario = environment.baseUrl + '/api/tarifario/';





constructor() { }




// GetTarifario(idCliente: number): Observable<tarifario[]> {
//   return this._httpClient.get<tarifario[]>(`${this.baseUrlTarifario}listar-por-cliente/${idCliente}`);
// }

// guardarTarifa(tarifa: any): Observable<any> {
//   return this._httpClient.post<any>(`${this.baseUrlTarifario}agregar`, tarifa).pipe(
//     catchError(err => {
//       console.error('Error desde el servicio:', err);
//       return throwError(() => err);
//     })
//   );
// }

// getTarifaById(id: number): Observable<any> {
//   return this._httpClient.get<any>(`${this.baseUrlTarifario}GetTarifaById/${id}`);
// }

// actualizarTarifa(id: number, tarifa: any): Observable<any> {
//   return this._httpClient.put<any>(`${this.baseUrlTarifario}editar/${id}`, tarifa);
// }

// eliminarTarifa(id: number): Observable<any> {
//   return this._httpClient.delete(`${this.baseUrlTarifario}eliminar/${id}`);
// }



}
