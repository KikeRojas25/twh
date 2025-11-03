import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Ubigeo } from '../_models/ubigeo';
import { PedidoDetalle, PedidoRequest } from './b2b.types';


const httpOptions = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
    'Content-Type' : 'application/json ; charset=utf-8',

  }),
};




@Injectable({
  providedIn: 'root'
})
export class B2bService {
private baseUrlPedidos = environment.baseUrl + '/api/public/PedidosB2B/';
private baseUrlGeneral = environment.baseUrl + '/api/General/';
private baseUrlPlanning = environment.baseUrl + '/api/Planning/';
private baseUrl = environment.baseUrl + '/api/public/inventory/';
private _httpClient = inject(HttpClient);

constructor() { }

getInventarioPorCodigo(codigo: string) {
  return this._httpClient.get<any>(`${this.baseUrl}${codigo}`);
}

getUbigeo(criterio): Observable<Ubigeo[]> {
  return this._httpClient.get<Ubigeo[]>(this.baseUrlGeneral + 'GetListUbigeo?criterio=' + criterio  , httpOptions);
}

 registrarPedido(request: PedidoRequest): Observable<any> {
    return this._httpClient.post(`${this.baseUrlPedidos}RegistrarPedido`, request, httpOptions);
  }


obtenerDetallePedido(pedidoId: number): Observable<{ success: boolean; message: string; data: PedidoDetalle[] }> {
  return this._httpClient.get<{ success: boolean; message: string; data: PedidoDetalle[] }>(
    `${this.baseUrlPedidos}${pedidoId}/detalle`
  );
}
// Obtener pedido por ID
obtenerPedidoPorId(id: number): Observable<any> {
  return this._httpClient.get<any>(`${this.baseUrl}/${id}`);
}

// Actualizar pedido
actualizarPedido(pedido: any): Observable<any> {
  return this._httpClient.put<any>(`${this.baseUrlPedidos}${pedido.id}`, pedido, httpOptions);
}

getPedidoById(id: number): Observable<any> {
  return this._httpClient.get(`${this.baseUrlPedidos}${id}`);
}

  planificarPicking(model: any): Observable<any> {
    return this._httpClient.post<any>(`${this.baseUrlPlanning}PlanificarPicking`, model);
  }

}
