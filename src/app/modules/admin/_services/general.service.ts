import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { ValorTabla } from '../_models/valortabla';
import { map, Observable } from 'rxjs';
import { Almacen } from '../_models/almacen';
import { Ubicacion } from '../planning/planning.types';
import { Area, Estado } from '../inventario/inventario.type';
import { Distrito, Provincia } from '../transporte/transporte.types';

// Interfaces adicionales si son necesarias
export interface Nivel {
  id: number;
  nombre: string;
}

export interface Master {
  id: number;
  nombre: string;
  [key: string]: any;
}


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

    getNiveles(): Observable<Nivel[]> {
      return this._httpClient.get<Nivel[]>(this.baseUrl + 'GetNiveles', httpOptions);
    }

    getAllUbicaciones(AlmacenId: number, AreaId: string): Observable<Ubicacion[]> {
      if (AreaId === null) {
        AreaId = '';
      }
      const params = 'AlmacenId=' + AlmacenId + '&AreaId=' + AreaId;
      return this._httpClient.get<Ubicacion[]>(this.baseUrl + 'GetUbicaciones?' + params, httpOptions);
    }

    getAllUbicaciones2(AlmacenId: number, AreaId: string, ubicacion: string): Observable<Ubicacion[]> {
      if (AreaId === null) {
        AreaId = '';
      }
      if (ubicacion === undefined) {
        ubicacion = '';
      }
      const params = 'AlmacenId=' + AlmacenId + '&AreaId=' + AreaId + '&Ubicacion=' + ubicacion;
      return this._httpClient.get<Ubicacion[]>(this.baseUrl + 'GetAllUbicaciones?' + params, httpOptions);
    }

    getAllUbicacionesxNivel(AlmacenId: number, AreaId: number, NivelId: string, ColumnaId: string): Observable<Master[]> {
      if (NivelId === undefined) NivelId = '';
      if (ColumnaId === undefined) ColumnaId = '';
      const params = 'AlmacenId=' + AlmacenId + '&AreaId=' + AreaId + '&NivelId=' + NivelId + '&ColumnaId=' + ColumnaId;
      return this._httpClient.get<Master[]>(this.baseUrl + 'GetUbicacionesxNivel?' + params, httpOptions);
    }

    getAllUbicacionesxColumna(AlmacenId: number, AreaId: number, ColumnaId: string, NivelId: string): Observable<Master[]> {
      if (NivelId === undefined) NivelId = '';
      if (ColumnaId === undefined) ColumnaId = '';
      const params = 'AlmacenId=' + AlmacenId + '&AreaId=' + AreaId + '&ColumnaId=' + ColumnaId + '&NivelId=' + NivelId;
      return this._httpClient.get<Master[]>(this.baseUrl + 'GetUbicacionesxNivel?' + params, httpOptions);
    }

    getUbicacion(ubicacion: string): Observable<Ubicacion[]> {
      const params = 'Ubicacion=' + ubicacion;
      return this._httpClient.get<Ubicacion[]>(this.baseUrl + 'GetUbicacion?' + params, httpOptions);
    }

    eliminarUbicacion(id: number): Observable<Ubicacion[]> {
      return this._httpClient.delete<Ubicacion[]>(this.baseUrl + 'DeleteUbicacion?id=' + id, httpOptions);
    }

    registrarUbicacion(model: any): Observable<Ubicacion[]> {
      const body = JSON.stringify(model);
      return this._httpClient.post<Ubicacion[]>(this.baseUrl + 'registrarUbicacion?', body, httpOptions);
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


GetAllProvincias(departamentoId: any): Observable<Provincia[]> {
  return this._httpClient.get<Provincia[]>( `${this.baseUrl}GetAllProvincias?departamentoId=${departamentoId}`, httpOptions);
}



GetDistritos(idprovincia: any): Observable<Distrito[]> {
  return this._httpClient.get<Distrito[]>( `${this.baseUrl}GetDistritos?idprovincia=${idprovincia}`, httpOptions);
}



}
