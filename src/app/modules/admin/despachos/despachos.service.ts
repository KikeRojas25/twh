import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, Observable, throwError, map } from 'rxjs';
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
  private baseUrlDespacho = environment.baseUrl + '/api/Despacho/';
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
  return this._httpClient.get<carga[]>(this.baseUrlDespacho + 'GetAllCargas_Pendientes_Salida' + params, httpOptions);
}


registrar_salidacarga(model: any) {
  return this._httpClient.post(this.baseUrl + 'RegisterSalidaShipment', model, httpOptions);
}

UpdateGuiasForOrdenesSalida(model: any){
  return this._httpClient.post(this.baseUrl + 'UpdateGuiasForOrdenesSalida', model, httpOptions);
}
 obtenerDetalleOrdenSalida(id: number): Observable<OrdenSalidaDetalle[]> {
    return this._httpClient.get<OrdenSalidaDetalle[]>(`${this.baseUrl}detalle/${id}`, httpOptions);
  }

  
  agregarBulto(ordenSalidaId: number, bulto: BultoSalida): Observable<BultoSalida> {
    return this._httpClient.post<BultoSalida>(`${this.baseUrlDespacho}${ordenSalidaId}/bultos`, bulto, httpOptions);
  }

  agregarDetalleBulto(bultoId: number, detalle: BultoSalidaDetalle): Observable<BultoSalidaDetalle> {
    return this._httpClient.post<BultoSalidaDetalle>(`${this.baseUrlDespacho}bultos/${bultoId}/detalles`, detalle, httpOptions);
  }

  eliminarDetalleBulto(detalleId: number): Observable<any> {
    return this._httpClient.delete(`${this.baseUrlDespacho}bultos/detalles/${detalleId}`, httpOptions);
  }

  eliminarBulto(bultoId: number): Observable<any> {
    return this._httpClient.delete(`${this.baseUrlDespacho}bultos/${bultoId}`, httpOptions);
  }

obtenerBultosPorOrden(ordenSalidaId: number): Observable<BultoSalida[]> {
  return this._httpClient.get<BultoSalida[]>(`${this.baseUrlDespacho}${ordenSalidaId}/bultos` , httpOptions);
}

  validarBultosCompletos(ordenSalidaId: number): Observable<any> {
    return this._httpClient.get<any>(`${this.baseUrlDespacho}ordenesalida/${ordenSalidaId}/validar-bultos-completos` , httpOptions);
  }


actualizarPesoBulto(bultoId: number, peso: number) {
  return this._httpClient.put(`${this.baseUrlDespacho}bultos/${bultoId}/peso`, JSON.stringify(peso), {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token')
    })
  });
}



  uploadFileMasivo(userId: number, propietarioId: number, almacenId: number, file: File) {
  const formData: FormData = new FormData();
  formData.append('file', file, file.name);

  return this._httpClient.post(
    `${this.baseUrl}UploadFile?usrid=${userId}&propietarioid=${propietarioId}&almacenid=${almacenId}`,
    formData,
    {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + localStorage.getItem('token')
      })
    }
  );
}




procesarMasivo(carga: any) {
  return this._httpClient.post(`${this.baseUrl}ProcesarMasivo`, carga, {
    headers: new HttpHeaders({
      Authorization: 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'
    })
  });
}

actualizarFechaSalida(ordenSalidaId: number, fechaSalida: Date): Observable<any> {
  const dto = {
    ordenSalidaId: ordenSalidaId,
    fechaSalida: fechaSalida
  };
  return this._httpClient.post(`${this.baseUrl}ActualizarFechaSalida`, dto, httpOptions);
}

obtenerOrdenSalidaPorId(id: number): Observable<OrdenSalida> {
  // Endpoint: GET /api/OrdenSalida/{ordenSalidaId}
  return this._httpClient.get<OrdenSalida>(`${this.baseUrl}${id}`, httpOptions).pipe(
    catchError((error) => {
      console.error('Error al obtener orden de salida:', error);
      // Si el endpoint falla, intentar obtener desde la lista como fallback
      console.warn('Endpoint directo no disponible, buscando en la lista');
      const model = {
        PropietarioId: '',
        AlmacenId: '',
        estadoIdfiltro: '',
        fec_ini: new Date(new Date().getFullYear(), 0, 1), // Desde inicio del año
        fec_fin: new Date(), // Hasta hoy
        guiaremision: ''
      };
      return this.getAllOrdenSalida(model).pipe(
        map((ordenes: OrdenSalida[]) => {
          const orden = ordenes.find((o: any) => 
            (o.ordenSalidaId === id || o.id === id)
          );
          if (!orden) {
            throw new Error(`Orden con ID ${id} no encontrada`);
          }
          return orden;
        }),
        catchError((err) => throwError(() => err))
      );
    })
  );
}

actualizarOrdenSalida(model: any): Observable<any> {
  // Endpoint: PUT /api/OrdenSalida/UpdateOrdenSalida
  // Recibe OrdenSalidaForRegister con los mismos parámetros que el registro
  return this._httpClient.put(`${this.baseUrl}UpdateOrdenSalida`, model, httpOptions);
}
}



