import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { ValorTabla } from '../_models/valortabla';
import { map, Observable } from 'rxjs';
import { Almacen } from '../_models/almacen';
import { Ubicacion } from '../planning/planning.types';
import { Area, Estado } from '../inventario/inventario.type';


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
export class GeneralService {

  private baseUrl = environment.baseUrl + '/api/General/';
  private baseUrlAlmacen = environment.baseUrl + '/api/Almacen/';
  private _httpClient = inject(HttpClient);


constructor() { }

    getValorTabla(TablaId: number): Observable<ValorTabla[]> {
      return this._httpClient.get<ValorTabla[]>(this.baseUrl + 'GetAllValorTabla?TablaId=' + TablaId, httpOptions);
    }

    getAllAlmacenes(): Observable<Almacen[]> {
      return this._httpClient.get<Almacen[]>(this.baseUrlAlmacen + 'GetAlmacenes' , httpOptions);
    }


    getPuertas(AlmacenId: number, AreaId: number): Observable<Ubicacion[]> {
      const params = 'AlmacenId=' + AlmacenId + '&AreaId=' + AreaId;
      return this._httpClient.get<Ubicacion[]>(this.baseUrl + 'getPuertas?' + params, httpOptions);
    }

    
  setUbicacion(paletas: string, Ubicacionid: number ){
    var model: any = {}  ;
    model.paletas = paletas.toString();
    model.ubicacionid = Ubicacionid;
    console.log(model, 'model');
    return this._httpClient.post<Ubicacion[]>(this.baseUrl + 'SetUbicacion?' , model, httpOptions);
  }

  getAllUbicacionesxNombre(AlmacenId: number, Ubicacion: string): Observable<Ubicacion[]> {
    const params = 'AlmacenId=' + AlmacenId + '&Ubicacion=' + Ubicacion;
    return this._httpClient.get<Ubicacion[]>(this.baseUrl + 'GetUbicacionesxNombre?' + params, httpOptions);
  }
  getAll(TablaId: number): Observable<Estado[]> {
    return this._httpClient.get<Estado[]>(this.baseUrl + '?TablaId=' + TablaId, httpOptions);
  }
    getAreas(): Observable<Area[]> {
    return this._httpClient.get<Area[]>(this.baseUrl + 'GetAreas', httpOptions);
  }
  setUbicacionMasiva(data: { Paletas : string[], UbicacionId: number, IdUsuario: number }) {
  return this._httpClient.post(this.baseUrl + 'reubicar-masivo', data);
}

}
