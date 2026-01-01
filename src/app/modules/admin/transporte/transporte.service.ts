import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { tarifario, OrdenTransporteResult, ManifiestoResult } from './transporte.types';



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
    private baseUrlOrdenTransporte = environment.baseUrl + '/api/OrdenTransporte/';





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

getAllOrder(
  remitente_id?: number,
  estado_id?: number,
  usuario_id: number = 0,
  fec_ini?: string,
  fec_fin?: string,
  shipment?: string
): Observable<OrdenTransporteResult[]> {
  let params = `usuario_id=${usuario_id}`;
  
  if (remitente_id !== undefined && remitente_id !== null) {
    params += `&remitente_id=${remitente_id}`;
  }
  
  if (estado_id !== undefined && estado_id !== null) {
    params += `&estado_id=${estado_id}`;
  }
  
  if (fec_ini) {
    params += `&fec_ini=${encodeURIComponent(fec_ini)}`;
  }
  
  if (fec_fin) {
    params += `&fec_fin=${encodeURIComponent(fec_fin)}`;
  }
  
  if (shipment) {
    params += `&shipment=${encodeURIComponent(shipment)}`;
  }
  
  return this._httpClient.get<OrdenTransporteResult[]>(`${this.baseUrlOrdenTransporte}GetAllOrder?${params}`, httpOptions).pipe(
    catchError(err => {
      console.error('Error desde el servicio:', err);
      return throwError(() => err);
    })
  );
}

listarManifiestos(
  remitente_id?: string,
  fec_ini?: string,
  fec_fin?: string,
  numero_manifiesto?: string
): Observable<ManifiestoResult[]> {
  let params = '';
  
  if (remitente_id) {
    params += `remitente_id=${encodeURIComponent(remitente_id)}`;
  }
  
  if (fec_ini) {
    params += params ? `&fec_ini=${encodeURIComponent(fec_ini)}` : `fec_ini=${encodeURIComponent(fec_ini)}`;
  }
  
  if (fec_fin) {
    params += params ? `&fec_fin=${encodeURIComponent(fec_fin)}` : `fec_fin=${encodeURIComponent(fec_fin)}`;
  }
  
  if (numero_manifiesto) {
    params += params ? `&numero_manifiesto=${encodeURIComponent(numero_manifiesto)}` : `numero_manifiesto=${encodeURIComponent(numero_manifiesto)}`;
  }
  
  const url = params ? `${this.baseUrlOrdenTransporte}ListarManifiestos?${params}` : `${this.baseUrlOrdenTransporte}ListarManifiestos`;
  
  return this._httpClient.get<ManifiestoResult[]>(url, httpOptions).pipe(
    catchError(err => {
      console.error('Error desde el servicio:', err);
      return throwError(() => err);
    })
  );
}

}
