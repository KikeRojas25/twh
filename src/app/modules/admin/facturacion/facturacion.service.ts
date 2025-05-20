import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { PreLiquidacion } from './facturacion.types';


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
export class FacturacionService {


  private baseUrl = environment.baseUrl + '/api/facturacion/';
  private _httpClient = inject(HttpClient);

constructor() { }

getPendientesLiquidacion(id: number , model: any): Observable<PreLiquidacion[]> {
  const params = '?Id=' + id +
   '&fechainicio=' + model.InicioCorte +
   '&fechafin=' + model.FinCorte;

  return this._httpClient.get<PreLiquidacion[]>(this.baseUrl + 'GetPendientesLiquidacion' + params, httpOptions);
}

consultar_preliquidacion(model: any) : Observable<any[]>{
  return this._httpClient.post<any[]>(this.baseUrl + 'ConsultarPreliquidacion', model, httpOptions)
  ; }
  
generar_preliquidacion(model: any){
  return this._httpClient.post(this.baseUrl + 'GenerarPreliquidacion', model, httpOptions)
  ; }


  consultar_liquidacion(model: any) : Observable<any[]>{
  return this._httpClient.post<any[]>(this.baseUrl + 'ConsultarLiquidacion', model, httpOptions)
  ; }


}
