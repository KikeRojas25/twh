import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { BultoSalida, BultoSalidaDetalle, carga, OrdenSalida, OrdenSalidaDetalle } from './despachos.types';


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
export class DespachosService {

  private baseUrl = environment.baseUrl + '/api/OrdenSalida/';
  private baseUrlConductor = environment.baseUrl + '/api/Conductor/';
  private _httpClient = inject(HttpClient);


constructor() { }

getAllOrdenSalida(model: any): Observable<OrdenSalida[]> {
  const defaultValues = {
    estadoIdfiltro: '',
    PropietarioId: '',
    AlmacenId: ''
  };

      // Asignar valores por defecto si son undefined
      model.estadoIdfiltro = model.estadoIdfiltro ?? defaultValues.estadoIdfiltro;
      model.PropietarioId = model.PropietarioId ?? defaultValues.PropietarioId;
      model.AlmacenId = model.AlmacenId ?? defaultValues.AlmacenId;

      // Formatear fechas
      const fecIni = model.fec_ini.toLocaleDateString();
      const fecFin = model.fec_fin.toLocaleDateString();

      // Construir parámetros de consulta
      const params = new URLSearchParams({
        PropietarioID: model.PropietarioId,
        EstadoId: model.estadoIdfiltro,
        fec_ini: fecIni,
        fec_fin: fecFin,
        guiaremision: model.guiaremision,
        AlmacenId: model.AlmacenId
      }).toString();

      return this._httpClient.get<OrdenSalida[]>(`${this.baseUrl}GetAllOrdenSalida?${params}`, httpOptions);
}

RegistarOrdenSalida(model: any){
      return this._httpClient.post(this.baseUrl + 'RegisterOrdenSalida', model, httpOptions);
}
deleteOrder(id: any){
  const url = `${this.baseUrl}DeleteOrder/${id}`;
  return this._httpClient.delete(url, httpOptions);

}

getAllCargas_pendientes(model: any): Observable<carga[]> {
  const params = '?PropietarioID=' + model.PropietarioId +
  '&EstadoId=' + model.EstadoId ;
  return this._httpClient.get<carga[]>(this.baseUrl + 'GetAllCargas_Pendientes_Salida' + params, httpOptions);
}


registrar_salidacarga(model: any) {
  return this._httpClient.post(this.baseUrl + 'RegisterSalidaShipment', model, httpOptions);
}

UpdateGuiasxShipmentIs(model: any){
  return this._httpClient.post(this.baseUrl + 'UpdateGuiasxShipmentIs', model, httpOptions);
}
 obtenerDetalleOrdenSalida(id: number): Observable<OrdenSalidaDetalle[]> {
    return this._httpClient.get<OrdenSalidaDetalle[]>(`${this.baseUrl}detalle/${id}`);
  }

  
  agregarBulto(ordenSalidaId: number, bulto: BultoSalida): Observable<BultoSalida> {
    return this._httpClient.post<BultoSalida>(`${this.baseUrl}${ordenSalidaId}/bultos`, bulto);
  }

  agregarDetalleBulto(bultoId: number, detalle: BultoSalidaDetalle): Observable<BultoSalidaDetalle> {
    return this._httpClient.post<BultoSalidaDetalle>(`${this.baseUrl}bultos/${bultoId}/detalles`, detalle);
  }

  eliminarDetalleBulto(detalleId: number): Observable<any> {
    return this._httpClient.delete(`${this.baseUrl}bultos/detalles/${detalleId}`);
  }

  eliminarBulto(bultoId: number): Observable<any> {
    return this._httpClient.delete(`${this.baseUrl}bultos/${bultoId}`);
  }

obtenerBultosPorOrden(ordenSalidaId: number): Observable<BultoSalida[]> {
  return this._httpClient.get<BultoSalida[]>(`${this.baseUrl}${ordenSalidaId}/bultos`);
}

  validarBultosCompletos(ordenSalidaId: number): Observable<any> {
    return this._httpClient.get<any>(`${this.baseUrl}ordenesalida/${ordenSalidaId}/validar-bultos-completos`);
  }


actualizarPesoBulto(bultoId: number, peso: number) {
  return this._httpClient.put(`${this.baseUrl}bultos/${bultoId}/peso`, JSON.stringify(peso), {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token')
    })
  });
}


}
