import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Cliente, Grupo, Sucursal } from '../facturacion/cliente.type';
import { Observable } from 'rxjs';
import { Ubigeo } from '../_models/ubigeo';



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
export class ClienteService {

  private baseUrl = environment.baseUrl + '/api/Clientes/';
  private baseUrlOrdenSalida = environment.baseUrl + '/api/OrdenSalida/';
  private _httpClient = inject(HttpClient);

constructor() { }

// getAllPropietarios(IdGrupo: string): Observable<Cliente[]> {
//   return this._httpClient.get<Cliente[]>(this.baseUrl + 'GetAllPropietarios?IdGrupo=' + IdGrupo , httpOptions);
//  }


getPropietariosByUsuario(idUsuario: number): Observable<Cliente[]> {
  const url = `${this.baseUrl}usuarios/${idUsuario}/propietarios`;
  return this._httpClient.get<Cliente[]>(url, httpOptions);
}


 getAllGrupos(): Observable<Grupo[]> {
  return this._httpClient.get<Grupo[]>(this.baseUrl + 'GetAllGrupos?' , httpOptions);
 }

 getAllDirecciones(id: number): Observable<Ubigeo[]> {
  return this._httpClient.get<Ubigeo[]>(this.baseUrl + 'GetAllDirecciones?id=' + id , httpOptions);
  }

  
  getAllClientesxPropietarios(id: number): Observable<Cliente[]> {
    return this._httpClient.get<Cliente[]>(this.baseUrl + 'GetAllClientesxPropietarios?id=' + id , httpOptions);
    }


    
    getAllClientesDreamland(): Observable<Cliente[]> {
      return this._httpClient.get<Cliente[]>(this.baseUrlOrdenSalida + 'GetAllClientes', httpOptions);
    }

    getAllSucursal(IdCliente: number): Observable<Sucursal[]> {
        return this._httpClient.get<Sucursal[]>(this.baseUrlOrdenSalida + 'GetAllTiendas?IdCliente=' + IdCliente , httpOptions);
    }

      getClientePorDocumento(documento: string): Observable<any> {
    return this._httpClient.get<any>(`${this.baseUrl}document/${documento}`, httpOptions);
  }

}
