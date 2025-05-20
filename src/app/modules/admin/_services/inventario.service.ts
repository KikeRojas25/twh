
import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { InventarioGeneral, InventarioDetalle } from '../_models/inventariogeneral';
import { environment } from 'environments/environment';

import { HttpParams } from '@angular/common/http';
import { GraficoRecepcion, GraficoStock, Inventario, InventarioForEdit } from '../inventario/inventario.type';

const httpOptionsUpload = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
  })
  // , observe: 'body', reportProgress: true };
};


const httpOptions = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
    'Content-Type' : 'application/json'
  }),
};

@Injectable({
  providedIn: 'root'
})

export class InventarioService {
  baseUrl =  environment.baseUrl + '/api/inventario/';
  constructor(private http: HttpClient) {

     }

registrar_inventario(model: any) {
    return this.http.post(this.baseUrl + 'register_inventario', model, httpOptions)
    .pipe(
      map((response: any) => {
      }
    ));
}
registrar_inventariodetalle(model: any) {
  return this.http.post(this.baseUrl + 'RegistrarInventarioDetalle', model, httpOptions);
  // .pipe(
  //   map((response: any) => {
  //     console.log(response);
  //   }
  // ));
}
UpdateStatus(model: any) {
  return this.http.post(this.baseUrl + 'updateStatus', model, httpOptions)
  .pipe(
    map((response: any) => {
    }
  ));
}


ActualizarInventario(model: any) {
  return this.http.post(this.baseUrl + 'actualizar_inventario', model, httpOptions)
  .pipe(
    map((response: any) => {
    }
  ));

}


  SolicitarActualizarStock(data: InventarioForEdit): Observable<any> {
    return this.http.post(`${this.baseUrl}proponer-ajuste-cantidad`, data);
  }

actualizar_stock(model: any) {
  return this.http.post(this.baseUrl + 'actualizar_stock', model, httpOptions)
}

actualizarFechasLote(inventario: InventarioForEdit): Observable<any> {
    return this.http.post(`${this.baseUrl}actualizar-fechas-lote`, inventario);
}


actualizar_inventarios_masivo(model: any) {

  return this.http.post(this.baseUrl + 'actualizar_inventarios_masivo', model, httpOptions)
  .pipe(
    map((response: any) => {
    }
  ));
}


particionar_inventario(model: any) {
  return this.http.post(this.baseUrl + 'particionar_inventario', model, httpOptions)
  .pipe(
    map((response: any) => {
    }
  ));
}
extraer_inventario(model: any): any {
  return this.http.post(this.baseUrl + 'extraer_inventario', model, httpOptions)
}
merge_inventario(model: any) {
return this.http.post(this.baseUrl + 'merge_ajuste', model, httpOptions)
  .pipe(
    map((response: any) => {
    }
  ));
}
asignar_ubicacion(model: InventarioGeneral[]) {
  const body = JSON.stringify(model);

  return this.http.post(this.baseUrl + 'asignar_ubicacion', body, httpOptions)
  .pipe(
    map((response: any) => {
    }
   ));
}

terminar_acomodo(Id: number) {
  const model: any = {};
  model.OrdenReciboId = Id;

  return this.http.post(this.baseUrl + 'terminar_acomodo', model, httpOptions)
    .pipe(
      map((response: any) => {
        }
      ));
 }

almacenamiento(Id: number) {
  const model: any = {};
  model.Id = Id;

  return this.http.post(this.baseUrl + 'almacenamiento', model, httpOptions)
      .pipe(
        map((response: any) => {
        }
      ));
}
almacenamientoMasivo(Id: any) {
  const model: any = {};
  model.Id = Id;

  return this.http.post(this.baseUrl + 'almacenamientomasivo', model, httpOptions)
      .pipe(
        map((response: any) => {
        }
      ));
}

getAll(OrdenReciboID: number): Observable<InventarioGeneral[]> {
    const params = 'Id=' + OrdenReciboID ;
    return this.http.get<InventarioGeneral[]>(this.baseUrl + 'GetAll?' + params, httpOptions);
}
GetAllInventario(OrdenReciboId: any): Observable<InventarioGeneral[]> {
  const params = 'OrdenReciboId=' + OrdenReciboId ;
  return this.http.get<InventarioGeneral[]>(this.baseUrl + 'GetAllInventario?' + params, httpOptions);
}
GetInventario(id: number): Observable<InventarioGeneral> {
  const params = 'id=' + id ;
  return this.http.get<InventarioGeneral>(this.baseUrl + 'GetInventario?' + params, httpOptions);
}

GetAllKardex(model: any ): Observable<InventarioGeneral[]> {
  const params = 'idalmacen=' + model.AlmacenId + '&idproducto= ' + model.ProductoId + '&lote=' + model.lote +
  '&fec_ini=' + model.fec_ini.toLocaleDateString() +
  '&fec_fin=' + model.fec_fin.toLocaleDateString() ;
  return this.http.get<InventarioGeneral[]>(this.baseUrl + 'GetAllKardex?' + params, httpOptions);
}
GetAllInventario2(model: any ): Observable<InventarioGeneral[]> {
  const params = 'idalmacen=' + model.AlmacenId + '&idproducto= ' + model.ProductoId + '&lote=' + model.lote ;
  return this.http.get<InventarioGeneral[]>(this.baseUrl + 'GetAllInventario2?' + params, httpOptions);
}
GetReporteUbicaciones(model: any): Observable<InventarioGeneral[]> {
  const params = 'idalmacen=' + model.AlmacenId + '&ubicacion=' + model.ubicacion + '&idarea=' + model.areaId ;
  return this.http.get<InventarioGeneral[]>(this.baseUrl + 'GetReporteUbicaciones?' + params, httpOptions);
}
GetReporteUbicacionesDetallado(model: any): Observable<InventarioGeneral[]> {
  const params = 'idubicacion=' + model.id ;
  return this.http.get<InventarioGeneral[]>(this.baseUrl + 'GetReporteUbicacionesDetallado?' + params, httpOptions);
}

GetInventarioCabecera(model: any): Observable<Inventario[]> {

  const params = '?PropietarioID=' + model.PropietarioId +
  '&fec_ini=' + model.fec_ini.toLocaleDateString() +
  '&fec_fin=' + model.fec_fin.toLocaleDateString() +
  '&AlmacenId=' + model.AlmacenId ;
  return this.http.get<Inventario[]>(this.baseUrl + 'GetInventarioCabecera?' + params, httpOptions)
}

GetInventarioByLotNum(productoid: any , lotnum: any): Observable<InventarioGeneral> {
  const params = 'productoid=' + productoid + '&lotnum=' + lotnum;
  return this.http.get<InventarioGeneral>(this.baseUrl + 'GetInventarioByLotNum?' + params, httpOptions);
}

GetAllInventarioDetalle(InventarioId: any): Observable<InventarioDetalle[]> {
  const params = 'InventarioId=' + InventarioId ;
  return this.http.get<InventarioDetalle[]>(this.baseUrl + 'GetAllInventarioDetalle?' + params, httpOptions);
}


getPallet(id: any): Observable<InventarioGeneral[]> {
     const params = 'OrdenReciboId=' + id ;
     return this.http.get<InventarioGeneral[]>(this.baseUrl + 'GetPallet?' + params, httpOptions);
}

  getGraficoStock(PropietarioId: number, AlmacenId: number): Observable<GraficoStock[]> {
    const params = 'PropietarioId=' + PropietarioId +
    '&AlmacenId=' + AlmacenId;
    return this.http.get<GraficoStock[]>(this.baseUrl + 'GetGraficoStock?' + params, httpOptions);
  }
  getGraficoRecepcion(PropietarioId: number, AlmacenId: number): Observable<GraficoRecepcion[]> {
    const params = 'PropietarioId=' + PropietarioId +
    '&AlmacenId=' + AlmacenId;
    return this.http.get<GraficoRecepcion[]>(this.baseUrl + 'GetGraficoRecepcion?' + params, httpOptions);
  }

  get(InventarioId: number): Observable<InventarioGeneral[]> {
    const params = 'Id=' + InventarioId ;
    return this.http.get<InventarioGeneral[]>(this.baseUrl + 'get?' + params, httpOptions);
  }
  delInventarioDetall(Id: number)  {
    const model: any = {};
    model.id = Id;

    return this.http.delete(this.baseUrl + 'DeleteInventarioDetalle?id=' + Id, httpOptions)
        .pipe(
          map((response: any) => {
          }
        ));
  }
  getAllInventarioAjusteDetalle(Id: number
   ): Observable<InventarioGeneral[]> {
    const params = 'Id=' + Id;
    return this.http.get<InventarioGeneral[]>(this.baseUrl + 'GetAllInvetarioAjusteDetalle?' + params, httpOptions);
  }

  getAllInventarioAjuste(ClienteId: number
    ,                    ProductoId: any
    ,                    lpn: string
   ): Observable<InventarioGeneral[]> {

    let params = new HttpParams().set('ClienteId', ClienteId.toString());

    if (ProductoId) {
      params = params.set('ProductoId', ProductoId);
    }
  
    if (lpn) {
      params = params.set('lpn', lpn);
    }

    return this.http.get<InventarioGeneral[]>(this.baseUrl + 'GetAllInvetarioAjuste?' + params, httpOptions);
  }



  getAllInventarioReubicacion(ClienteId: number, ProductoId: any, lpn: string, ubicacion: string): Observable<InventarioGeneral[]> {

   if(ProductoId === undefined)
     ProductoId = '';

     if(lpn === undefined)
     lpn = '';

    const params = 'ClienteId=' + ClienteId +
    '&ProductoId=' + ProductoId +
    '&lpn=' + lpn +
    '&ubicacion=' + ubicacion ;

    return this.http.get<InventarioGeneral[]>(this.baseUrl + 'getAllInventarioReubicacion?' + params, httpOptions);

  }




  registrar_ajuste(model: any) {
    return this.http.post(this.baseUrl + 'register_ajuste', model, httpOptions)
    .pipe(
      map((response: any) => {
      }
    ));
  }




uploadFile_Inventario(formData: FormData, UserId: number,model: any): any {
  return this.http.post(this.baseUrl + 'uploadFile_Inventario?usrid=' + UserId.toString() +
  '&propietarioid=' + model.PropietarioId +
  '&almacenid=' + model.AlmacenId

 , formData
 , httpOptionsUpload
);
}
procesarCarga_Inventario(Id: number, PropietarioId: number, ) : any {
    const model: any = {};
    model.PropietarioId = PropietarioId;
    model.id = Id;

  return this.http.post(this.baseUrl + 'ProcesarMasivo', model , httpOptions
);
}


  proponerAjuste(data: InventarioForEdit): Observable<any> {
    return this.http.post(`${this.baseUrl}proponer-ajuste`, data);
  }


  actualizarFechaLote(data: any): Observable<any> {
  return this.http.post(`${this.baseUrl}actualizarfechalote`, data);
}



}
