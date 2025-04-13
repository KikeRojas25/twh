import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OrdenSalida } from '../despachos/despachos.types';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';



const httpOptions = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
    'Content-Type' : 'application/json'
  }),
};


@Injectable({
  providedIn: 'root'
})
export class PlanningService {
  baseUrl = environment.baseUrl + '/api/ordensalida/';
// baseUrl2 = environment.baseUrl1 +  '/api/ordensalida/';

  
constructor(private http: HttpClient) { }


getAllOrdenSalidaPendientes(model: any): Observable<OrdenSalida[]> {

  if(model.AlmacenId === undefined) {
   model.AlmacenId = '';
  }
 
  if(model.PropietarioId === undefined) {
   model.PropietarioId = '';
  }
   const params = '?PropietarioID=' + model.PropietarioId +
   '&AlmacenId=' + model.AlmacenId ;
    '&fec_ini='  +
    '&fec_fin='  ;
 
   return this.http.get<OrdenSalida[]>(this.baseUrl + 'GetAllOrderPendiente' + params, httpOptions);
 }

 
getAllOrdenSalida(model: any): Observable<OrdenSalida[]> {

  if(model.AlmacenId === undefined) {
   model.AlmacenId = '';
  }
 
  if(model.PropietarioId === undefined) {
   model.PropietarioId = '';
  }
   const params = '?PropietarioID=' + model.PropietarioId +
   '&AlmacenId=' + model.AlmacenId ;
    '&fec_ini='  +
    '&fec_fin='  ;
 
   return this.http.get<OrdenSalida[]>(this.baseUrl + 'GetAllOrders' + params, httpOptions);
 }
 getAllOrdenSalidaPlanificadosConPlaca(model: any): Observable<OrdenSalida[]> {

  if(model.AlmacenId === undefined) {
   model.AlmacenId = '';
  }
 
  if(model.PropietarioId === undefined) {
   model.PropietarioId = '';
  }
   const params = '?PropietarioID=' + model.PropietarioId +
   '&AlmacenId=' + model.AlmacenId ;
    '&fec_ini='  +
    '&fec_fin='  ;
 
   return this.http.get<OrdenSalida[]>(this.baseUrl + 'GetAllOrdersPlanificadoConPlaca' + params, httpOptions);
 }


 
getAllOrdenSalidaPendientesResumen(model: any): Observable<any> {

  if(model.AlmacenId === undefined) {
   model.AlmacenId = '';
  }

  if(model.PropietarioId === undefined) {
   model.PropietarioId = '';
  }
   const params = '?PropietarioID=' + model.PropietarioId +
   '&AlmacenId=' + model.AlmacenId +
     '&fec_ini='  +
  '&fec_fin=' ;

   return this.http.get<any>(this.baseUrl + 'GetAllOrderPendienteResumen' + params, httpOptions);
 }

 
PlanificarPicking(model: any){
  return this.http.post(this.baseUrl + 'PlanificarPicking', model, httpOptions);
}

PlanificarDespacho(model: any){
  return this.http.post(this.baseUrl + 'PlanificarDespacho', model, httpOptions);
}

// PlanificarPickingMasivo(model: any){
//   return this.http.post(this.baseUrl2 + 'PlanificarPickingMasivo', model, httpOptions);
// }





}
