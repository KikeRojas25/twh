import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { carga, OrdenSalida } from '../despachos/despachos.types';
import { map, Observable } from 'rxjs';
import { environment } from 'environments/environment';



const httpOptions = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
    'Content-Type' : 'application/json'
  }),
};


const httpOptions2 = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('accessToken2'),
    'Content-Type' : 'application/json'
  }),
};


@Injectable({
  providedIn: 'root'
})
export class PlanningService {
  baseUrl = environment.baseUrl + '/api/ordensalida/';
  baseUrl2 = environment.baseUrl_2 +  '/api/ordensalida/';
  baseUrlPlanning = environment.baseUrl +  '/api/planning/';
  
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

  return this.http.post(this.baseUrl2 + 'PlanificarPicking', model, httpOptions2);
}

PlanificarDespacho(model: any){
  return this.http.post(this.baseUrl2 + 'PlanificarDespacho', model, httpOptions);
}

// PlanificarPickingMasivo(model: any){
//   return this.http.post(this.baseUrl2 + 'PlanificarPickingMasivo', model, httpOptions);
// }
getWork(id: any): Observable<carga> {
  const params = '?id=' + id ;
  return this.http.get<carga>(this.baseUrl + 'GetWork' + params, httpOptions);
}


InicioPicking(ids: string) {
  const model: any = {};
  model.ids = ids;
  model.UserId = 1;


  return this.http.post(this.baseUrlPlanning + 'inicioPicking', model, httpOptions)
  .pipe(
    map((response: any) => {
    }
  )
); }

FinPicking(ids: string) {
  const model: any = {};
  model.ids = ids;
  model.UserId = 1;

  return this.http.post(this.baseUrlPlanning + 'finPicking', model, httpOptions)
  .pipe(
    map((response: any) => {
    }
  )
); 
}

getAllWork(model: any): Observable<any> {
  
  const params = new HttpParams()
    .set('PropietarioId', model.PropietarioId)
    .set('EstadoId', null);

    return this.http.get<any>(this.baseUrlPlanning + 'GetAllWork', { params });
}

deletePlanificacion(id: any): Observable<OrdenSalida[]> {
  const params = '?WrkId=' + id ;
  return this.http.delete<OrdenSalida[]>(this.baseUrlPlanning + 'EliminarPlanificacion' + params, httpOptions);
}

assignmentOfDoor(ids: string , ubicacionId: number) {
    const model: any = {};
    model.ids = ids;
    model.PuertaId = ubicacionId;

    return this.http.post(this.baseUrlPlanning + 'assignmentOfDoor', model, httpOptions)
    .pipe(
      map((response: any) => {
      }
    )
); 
}

assignmentOfUser(ids: string , UserId: string) {
  const model: any = {};
  model.ids = ids;
  model.UserId = UserId;

  return this.http.post(this.baseUrlPlanning + 'assignmentOfUser', model, httpOptions)
  .pipe(
    map((response: any) => {
    }
  )
); 
}







}
