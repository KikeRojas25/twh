import { Injectable, inject } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { map } from 'rxjs/operators';
import { Huella, HuellaDetalle, Producto } from '../inventario/inventario.type';

const httpOptions = {
    headers: new HttpHeaders({
      Authorization : 'Bearer ' + localStorage.getItem('token'),
      'Content-Type' : 'application/json'
    }),
};
@Injectable({
    providedIn: 'root'
  })
export class ProductoService {
  baseUrl = environment.baseUrl + '/api/producto/';
  private _httpClient = inject(HttpClient);

  constructor() { }

  getAllProductos(criterio: string, ClienteId: number): Observable<Producto[]> {
    return this._httpClient.get<Producto[]>(this.baseUrl + 'GetAllProductos?criterio=' + criterio
    + '&ClienteId=' + ClienteId, httpOptions);
  }
  getByCodigo(criterio: string, ClienteId: number): Observable<Producto[]> {
    return this._httpClient.get<Producto[]>(this.baseUrl + '?criterio=' + criterio
      + '&ClienteId=' + ClienteId, httpOptions);
  }
  get(ProductoId: number): Observable<Producto[]> {
    return this._httpClient.get<Producto[]>(this.baseUrl + 'Get?ProductId=' + ProductoId , httpOptions);
  }
  getHuellas(ProductoId: any){
    return this._httpClient.get<Huella[]>(this.baseUrl + 'GetHuellas?ProductoId=' + ProductoId, httpOptions);
  }
  getHuella(HuellaId: number){
    return this._httpClient.get<Huella[]>(this.baseUrl + 'GetHuella?HuellaId=' + HuellaId, httpOptions);
  }
  getHuellasDetalle(HuellaId: number){
    return this._httpClient.get<HuellaDetalle[]>(this.baseUrl + 'GetHuellasDetalle?HuellaId=' + HuellaId, httpOptions);
  }
  registrarProducto(model: any){
    console.log(model);
    return this._httpClient.post(this.baseUrl + 'productRegister', model, httpOptions)
    .pipe(map((response: any) => {
       console.log(response);

    }));
  }
  editarProducto(model: any){
    return this._httpClient.post(this.baseUrl + 'productEdit', model, httpOptions)
    .pipe(map((response: any) => {
       console.log(response);

    }));
  }
  registrarHuellaDetalle(model: any){

    return this._httpClient.post(this.baseUrl + 'HuellaDetalleRegister', model, httpOptions)
    .pipe(map((response: any) => {
       console.log(response);

    }));
  }
  registrarHuella(model: any){

    return this._httpClient.post(this.baseUrl + 'HuellaRegister', model, httpOptions)
    .pipe(map((response: any) => {
       console.log(response);

    }));
  }
  editarHuella(model: any){
    return this._httpClient.post(this.baseUrl + 'HuellaUpdate', model, httpOptions)
    .pipe(map((response: any) => {
    }));
  }
  deleteHuellaDetalle(id: number){
    return this._httpClient.delete(this.baseUrl + 'HuellaDetalleDelete?id=' + id, httpOptions)
    .pipe(map((response: any) => {
    }));
  }
  validarSKU(codigo: string, idProductoActual?: number, idcliente?: number){
    let url = this.baseUrl + 'ValidarSKU?codigo=' + codigo;
    if (idProductoActual) {
      url += `&id=${idProductoActual}`;
    }
    if(idcliente){
      url += `&idcliente=${idcliente}`;
    }
    return this._httpClient.get<any>(url, httpOptions);
  }

  buscarProductosPorPropietario(propietarioId: number, filtro: string): Observable<any[]> {
    const url = `${this.baseUrl}buscar?propietarioId=${propietarioId}&query=${encodeURIComponent(filtro)}`;
    return this._httpClient.get<any[]>(url);
  }
  getCanales(): Observable<any[]> {
    return this._httpClient.get<any[]>(this.baseUrl + 'GetCanales', httpOptions);
  }
}
