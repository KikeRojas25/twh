import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { TarifaProveedorTransporte } from '../transporte.types';




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
export class TarifarioService {
      private _httpClient = inject(HttpClient);
      private baseUrl = environment.baseUrl + '/api/tarifario/';
  



constructor() { }



  listarPorProveedor(idProveedor?: number): Observable<TarifaProveedorTransporte[]> {
    return this._httpClient.get<TarifaProveedorTransporte[]>(`${this.baseUrl}listar-por-proveedor/${idProveedor}`);
  }

  agregar(tarifa: TarifaProveedorTransporte): Observable<TarifaProveedorTransporte> {
    return this._httpClient.post<TarifaProveedorTransporte>(`${this.baseUrl}agregar`, tarifa);
  }

  editar(id: number, tarifa: TarifaProveedorTransporte): Observable<any> {
    return this._httpClient.put(`${this.baseUrl}editar/${id}`, tarifa);
  }

  eliminar(id: number): Observable<any> {
    return this._httpClient.delete(`${this.baseUrl}eliminar/${id}`);
  }

  obtenerPorId(id: number): Observable<TarifaProveedorTransporte> {
  return this._httpClient.get<TarifaProveedorTransporte>(`${this.baseUrl}obtener/${id}`);
}




}
