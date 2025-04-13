import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { EquipoTransporte, OrdenRecibo, OrdenReciboDetalle } from './recepcion.types';
import { map, Observable } from 'rxjs';
import { InventarioGeneral } from '../_models/inventariogeneral';


const httpOptions = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
    'Content-Type' : 'application/json ; charset=utf-8',

  }),
};


@Injectable({
  providedIn: 'root'
})
export class RecepcionService {

  baseUrl = environment.baseUrl + '/api/ordenrecepcion/';
  constructor(private http: HttpClient) { }
  
  getAll(model: any): Observable<OrdenRecibo[]> {
  
    if(model.PropietarioId === undefined)
       model.PropietarioId = '';
       if(model.EstadoId === undefined)
       model.EstadoId = '';
       if(model.AlmacenId === undefined)
       model.AlmacenId = '';
       if(model.guiaremision === undefined)
       model.guiaremision = '';
    
  
    const params = '?PropietarioID=' + model.PropietarioId +
    '&EstadoId=' + model.EstadoId +
    '&fec_ini=' + model.fec_ini.toLocaleDateString() +
    '&fec_fin=' + model.fec_fin.toLocaleDateString() +
    '&AlmacenId=' + model.AlmacenId +
    '&guiaremision=' + model.guiaremision  ;
  
    return this.http.get<OrdenRecibo[]>(this.baseUrl + params, httpOptions);
  }
  getAllByEquipoTransporte(model: any): Observable<OrdenRecibo[]> {
    const params = '?EquipoTransporteId=' + model.EquipoTransporteId ;
    return this.http.get<OrdenRecibo[]>(this.baseUrl + 'GetOrderbyEquipoTransporte' + params, httpOptions);
  }
  // getCalendarioProgramados(): Observable<CalendarEventModel[]> {
  //   return this.http.get<CalendarEventModel[]>(this.baseUrl + 'GetListarCalendario'   , httpOptions);
  // }
  
  registrar(model: any){
    return this.http.post(this.baseUrl + 'register', model, httpOptions);
  }
  
  registerGuiaCabecera(model: any){
    return this.http.post(this.baseUrl + 'registerGuiaCabecera', model, httpOptions);
  }
  
  updateGuiaCabecera(model: any){
    return this.http.post(this.baseUrl + 'updateGuiaCabecera', model, httpOptions);
  }
  
  registerGuiaDetalle(model: any) {
    return this.http.post(this.baseUrl + 'registerGuiaDetalle', model, httpOptions);
  }
  
  listarguiacabecera() {
    return this.http.get<OrdenRecibo[]>(this.baseUrl + 'ListarGuiaCabecera?idcliente=&fecharegistro=', httpOptions);
  }
  listarguiaspendientes() {
    return this.http.get<OrdenRecibo[]>(this.baseUrl + 'ListarGuiaCabecera?idcliente=&fecharegistro=', httpOptions);
  }
  
  
  listarguiadetalle(id:any) {
    return this.http.get<OrdenRecibo[]>(this.baseUrl + 'ListarGuiaDetalle?idguia=' + id, httpOptions);
  }
  
  
  actualizar(model: any){
    return this.http.post(this.baseUrl + 'update', model, httpOptions);
  }
  
  obtenerOrden(id: any): Observable<OrdenRecibo> {
    return this.http.get<OrdenRecibo>(this.baseUrl + 'GetOrder?Id=' + id, httpOptions);
  }
  
  registrar_detalle(model: any){
    return this.http.post(this.baseUrl + 'register_detail', model, httpOptions)
    .pipe(
      map((response: any) => {
      }
     ));
  }
  
  agregar_error(iddetalle, iderror){
    const model: any = {};
    return this.http.post(this.baseUrl + 'adderrorguia?iddetalle=' +  iddetalle + '&iderror=' + iderror, model, httpOptions)
    .pipe(
      map((response: any) => {
      }
     ));
  }
  
  vincularEquipoTransporte(model: any){
      return this.http.post(this.baseUrl + 'RegisterEquipoTransporte', model, httpOptions);
  }
  matchEquipoTransporte(model: any){
    return this.http.post(this.baseUrl + 'MatchTransporteOrdenIngreso', model, httpOptions);
  }
  getEquipoTransporte(placa: string): Observable<EquipoTransporte> {
    return this.http.get<EquipoTransporte>(this.baseUrl + 'GetEquipoTransporte?placa=' + placa , httpOptions);
  }
  
  getAllEquipoTransporte(model: any): Observable<EquipoTransporte[]> {
  
    const params = '?PropietarioID=' + model.PropietarioId +
    '&EstadoId=' + model.EstadoId +
    '&fec_ini=' + model.fec_ini.toLocaleDateString() +
    '&fec_fin=' + model.fec_fin.toLocaleDateString() +
    '&AlmacenId=' + model.AlmacenId;
  
    return this.http.get<EquipoTransporte[]>(this.baseUrl + 'ListEquipoTransporte' + params , httpOptions);
  }
  deleteOrder(id: any): Observable<OrdenRecibo[]> {
    const params = '?OrdenReciboId=' + id ;
    return this.http.delete<OrdenRecibo[]>(this.baseUrl + params, httpOptions);
  }
  deleteOrderDetail(id: any): Observable<OrdenRecibo[]> {
    const params = '?id=' + id ;
    return this.http.delete<OrdenRecibo[]>(this.baseUrl + 'DeleteOrderDetail' + params, httpOptions);
  }
  
  // uploadFile(formData: FormData, UserId: number,model: any): any {
  //   return this.http.post(this.baseUrl + 'UploadFile?usrid=' + UserId.toString() +
  //   '&propietarioid=' + model.PropietarioId +
  //   '&almacenid=' + model.AlmacenId
  
  //  , formData
  //  , httpOptionsUpload
  // );
  // }
  procesarCarga(Id: number,  AlmacenId: number , PropietarioId: number ) : any {
      const model: any = {};
      model.PropietarioId = PropietarioId;
      model.id = Id;
      model.AlmacenId = AlmacenId;
  
      console.log(model);
  
    return this.http.post(this.baseUrl + 'ProcesarMasivo', model , httpOptions
  );
  }
  
  
  
  
  
  
  
  
  
  
  
  
  assignmentOfDoor(EquipoTransporteId: any , ubicacionId: number) {
      const model: any = {};
      model.EquipoTransporteId = EquipoTransporteId;
      model.ubicacionId = ubicacionId;
  
      return this.http.post(this.baseUrl + 'assignmentOfDoor', model, httpOptions)
      .pipe(
        map((response: any) => {
        }
      ));
    }
  
  // getMasivas(id: any) : Observable<any> {
  //   return this.http.get<CargaMasiva[]>(this.baseUrl + 'GetMasiva?id=' + id.toString()
  //   , httpOptions
  //  );
  // }
  
  obtenerOrdenDetalle(id: any): Observable<OrdenReciboDetalle> {
      return this.http.get<OrdenReciboDetalle>(this.baseUrl + 'GetOrderDetail?Id=' + id, httpOptions);
     }
  
  identificar_detalle(model: any) {
    return this.http.post(this.baseUrl + 'identify_detail', model, httpOptions)
    .pipe(
      map((response: any) => {
        }
     ));
  }
  
  identificar_detallePorPedido(model: any) {
    return this.http.post(this.baseUrl + 'identify_detail_pedidos', model, httpOptions)
    .pipe(
      map((response: any) => {
        }
     ));
  }
  
  
  
  
  identificar_detallemultiple(model: InventarioGeneral[], sobredimensiado? : string) {
  
    if(sobredimensiado === undefined)
    {
        sobredimensiado ='';
    }
  
    const body = JSON.stringify(model);
  
    return this.http.post(this.baseUrl + 'identify_detail_mix?sobredimensionado=' + sobredimensiado, body, httpOptions)
    .pipe(
      map((response: any) => {
      }
     ));
  }
  identificar_faltante(model: InventarioGeneral[]) {
    const body = JSON.stringify(model);
    return this.http.post(this.baseUrl + 'identify_faltante', body, httpOptions)
    .pipe(
      map((response: any) => {
      }
     ));
  }
  
  
  cerrar_identificacion(Id: any) {
  
    const body = '';
  
    return this.http.post(this.baseUrl + 'close_details?Id=' + Id, body, httpOptions)
    .pipe(
      map((response: any) => {
      }
     ));
   }

   
uploadFile(IdPropietario: number , IdAlmacen: number, usrid: number, file: File) : Observable<any>{
  const formData = new FormData();
  formData.append('file', file);

  const httpOptionsUpload = {
    headers: new HttpHeaders({
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    })
  };

  // Aquí especificamos responseType en la llamada al método post
  return this.http.post(`${this.baseUrl}UploadFile?propietarioid=${IdPropietario}&almacenid=${IdAlmacen}&usrid=${usrid}`, formData, {
    ...httpOptionsUpload, // Desestructuramos httpOptionsUpload
  //   responseType: 'blob'   // Añadimos responseType aquí
  });
}


getAllDestinosPalmas(id: any): Observable<any[]> {
  return this.http.get<any[]>(this.baseUrl + 'GetOrderDetail?Id=' + id, httpOptions);
 }
  }
  