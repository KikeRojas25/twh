import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, map, Observable, throwError } from 'rxjs';
import { EquipoTransporte } from '../recepcion/recepcion.types';
import { InventarioGeneral } from '../_models/inventariogeneral';




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
export class AlmacenajeService {

    private _httpClient = inject(HttpClient);
    private baseUrl = environment.baseUrl + '/api/almacenaje/';
    private baseUrlVehiculo = environment.baseUrl + '/api/vehiculo/';
    private baseUrlProveedor = environment.baseUrl + '/api/proveedor/';

    private baseUrlMantenimiento = environment.baseUrl + '/api/general/';
    private baseUrlTarifario = environment.baseUrl + '/api/tarifario/';





constructor() { }



ListarEquiposTransporte(

    EstadoId: number,
    PropietarioId: number,
    AlmacenId: number
  ): Observable<EquipoTransporte[]> {

    const params = new HttpParams()

      .set('EstadoId', EstadoId)
      .set('PropietarioId', PropietarioId)
      .set('AlmacenId', AlmacenId);

    return this._httpClient.get<EquipoTransporte[]>(`${this.baseUrl}Listar-EquiposTrasporte`, { 
      params, 
      headers: httpOptions.headers 
    });
  }
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

  identificar_detallemultiple(model: InventarioGeneral[], sobredimensiado?: string): Observable<any> {
    if (sobredimensiado === undefined) {
      sobredimensiado = '';
    }

    const body = JSON.stringify(model);

    return this._httpClient.post(this.baseUrl + 'identify_detail_mix?sobredimensionado=' + sobredimensiado, body, httpOptions)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError(err => {
          console.error('Error desde AlmacenajeService:', err);
          return throwError(() => err);
        })
      );
  }

}
