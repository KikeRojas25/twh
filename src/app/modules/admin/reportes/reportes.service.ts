import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { InventarioGeneral } from '../_models/inventariogeneral';
import { Observable } from 'rxjs';
import { OrderSummary } from './reportes.types';



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
export class ReportesService {

private _httpClient = inject(HttpClient);
private baseUrlInventario = environment.baseUrl + '/api/Inventario/';
private baseUrl = environment.baseUrl + '/api/Reporte/';
  
constructor() { }



getInventarioGeneral(IdGrupo?: number, IdPropietario?: number): Observable<InventarioGeneral[]> {
  
  
  const searchParams = {
    IdGrupo: IdGrupo === null? '': IdGrupo,     
    IdPropietario:  IdPropietario === null? '': IdPropietario,     

  };


  const filteredParams = Object.keys(searchParams)
  .filter(key => searchParams[key] !== undefined)
  .reduce((obj, key) => {
    obj[key] = searchParams[key];
    return obj;
  }, {});


  return this._httpClient.get<InventarioGeneral[]>(`${this.baseUrlInventario}GetInventarioGeneral`, { params: filteredParams  , headers: httpOptions.headers });
      
  }


  getKardexGeneral(IdAlmacen?: number, IdPropietario?: number, IdGrupo?: number, fecini?: Date, fecfin?: Date): Observable<InventarioGeneral[]> {
  
  
    const searchParams = {
      IdAlmacen: IdAlmacen,      // Puede ser undefined si no se pasa el parámetro
      IdPropietario: IdPropietario,
      IdGrupo: IdGrupo,
      fecini: fecini.toLocaleDateString(),
      fecfin: fecfin.toLocaleDateString()
    };
  
  
    const filteredParams = Object.keys(searchParams)
    .filter(key => searchParams[key] !== undefined)
    .reduce((obj, key) => {
      obj[key] = searchParams[key];
      return obj;
    }, {});
  
  
    return this._httpClient.get<InventarioGeneral[]>(`${this.baseUrlInventario}GetKardexGeneral`, { params: filteredParams  , headers: httpOptions.headers });
        
    }


  getAvanceTotal(IdPropietario: number, IdCliente?: number, IdTienda?: number): Observable<any> {
    const params = new HttpParams()
      .set('IdPropietario', IdPropietario.toString())
      .set('IdCliente', IdCliente !== undefined ? IdCliente.toString() : '')
      .set('IdTienda', IdTienda !== undefined ? IdTienda.toString() : '');
  
    // Hacer la petición HTTP GET
    return this._httpClient.get<any>(`${this.baseUrl}GetAvanceTotal`, { params });
  }

 getAvanceTotalxCliente(IdPropietario: number, fecini?: string, fecfin?: string) : Observable<any> {

  const params = new HttpParams()
      .set('IdPropietario', IdPropietario.toString())
      .set('fecini', fecini !== undefined ? fecini : '')
      .set('fecfin', fecfin !== undefined ? fecfin : '');


  return this._httpClient.get<any>(`${this.baseUrl}GetAvanceTotalPorTienda`,  { params } );
      


 }

 getOrderSummary(idPropietario: number, fecini?: string, fecfin?: string): Observable<OrderSummary> {
  const params: any = { IDPROPIETARIO: idPropietario };
  if (fecini) params.fecini = fecini;
  if (fecfin) params.fecfin = fecfin;

  return this._httpClient.post<OrderSummary>(this.baseUrl, params);
}




}
