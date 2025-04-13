import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { ValorTabla } from '../_models/valortabla';
import { Observable } from 'rxjs';
import { Almacen } from '../_models/almacen';


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
}
