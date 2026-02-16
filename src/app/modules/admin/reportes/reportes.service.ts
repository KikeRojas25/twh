import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { InventarioGeneral } from '../_models/inventariogeneral';
import { Observable } from 'rxjs';
import { OrderSummary, ReporteAjusteInventario } from './reportes.types';



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
// Nota: en algunos builds el tipado de `environment` puede no refrescarse de inmediato en watch mode.
// Por eso leemos la propiedad de forma defensiva y usamos un fallback razonable.
private reportesBaseUrl: string =
  (environment as any).reportesBaseUrl ??
  `${new URL(environment.baseUrl).origin}/reptwh`;
  
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

/**
 * Exporta Inventario General vía API (SSRS) como Excel.
 * Endpoint backend (ReporteController): GET /api/Reporte/ExportarInventarioExcel?clienteid=...&grupoid=...
 * Retorna el archivo como `File(...)` (xlsx) con `Content-Disposition`.
 */
exportarInventarioExcel(clienteid: number | string, grupoid?: number | string): Observable<HttpResponse<Blob>> {
  let params = new HttpParams().set('clienteid', String(clienteid));
  if (grupoid !== undefined && grupoid !== null && String(grupoid).trim() !== '') {
    params = params.set('grupoid', String(grupoid));
  }

  return this._httpClient.get(`${this.baseUrl}ExportarInventarioExcel`, {
    params,
    headers: httpOptions.headers,
    observe: 'response',
    responseType: 'blob',
  });
}

/**
 * Exporta Kardex Detallado vía API (SSRS) como Excel.
 * Endpoint backend (ReporteController):
 * GET /api/Reporte/ExportarKardexDetalladoExcel?propietarioId=...&fechaInicio=...&fechaFin=...&grupoid=...
 */
exportarKardexDetalladoExcel(params: {
  propietarioId: number | string;
  fechaInicio: string;
  fechaFin: string;
  grupoid?: number | string;
}): Observable<HttpResponse<Blob>> {
  let httpParams = new HttpParams()
    .set('propietarioId', String(params.propietarioId))
    .set('fechaInicio', params.fechaInicio)
    .set('fechaFin', params.fechaFin);

  if (params?.grupoid !== undefined && params.grupoid !== null && String(params.grupoid).trim() !== '') {
    httpParams = httpParams.set('grupoid', String(params.grupoid));
  }

  return this._httpClient.get(`${this.baseUrl}ExportarKardexDetalladoExcel`, {
    params: httpParams,
    headers: httpOptions.headers,
    observe: 'response',
    responseType: 'blob',
  });
}

/**
 * Exporta la Instrucción de Acomodo vía API como PDF.
 * Endpoint backend (ReporteController):
 * GET /api/Reporte/ExportarInstruccionAcomodoPdf?ordenreciboid=...
 */
exportarInstruccionAcomodoPdf(ordenreciboid: string): Observable<HttpResponse<Blob>> {
  const params = new HttpParams().set('ordenreciboid', ordenreciboid);

  return this._httpClient.get(`${this.baseUrl}ExportarInstruccionAcomodoPdf`, {
    params,
    headers: httpOptions.headers,
    observe: 'response',
    responseType: 'blob',
  });
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


getReporteAjusteInventario(propietarioId: string, fecIni: string, fecFin: string) {
  const params = new HttpParams()
    .set('propietarioId', propietarioId)
    .set('fecIni', fecIni)
    .set('fecFin', fecFin);

  return this._httpClient.get<ReporteAjusteInventario[]>(
    `${this.baseUrlInventario}reporte_movimientos_ubicaciones`, // <- nombre exacto del endpoint
    { params }
  );
}

/**
 * Descarga el reporte legacy (ASPX) como Blob, evitando mixed-content/popup.
 * Si el servidor de reportes está en otro origen, requiere CORS habilitado.
 */
downloadInventarioGeneralXls(params: { clienteid?: number; grupoid?: number }): Observable<Blob> {
  let httpParams = new HttpParams();
  if (params?.clienteid !== undefined && params.clienteid !== null) {
    httpParams = httpParams.set('clienteid', String(params.clienteid));
  }
  if (params?.grupoid !== undefined && params.grupoid !== null) {
    httpParams = httpParams.set('grupoid', String(params.grupoid));
  }

  return this._httpClient.get(`${this.reportesBaseUrl}/Rep_Inventario.aspx`, {
    params: httpParams,
    responseType: 'blob',
  });
}

downloadKardexGeneralXls(params: {
  Grupoid?: number;
  PropietarioId?: number;
  fecinicio: string;
  fecfin: string;
}): Observable<Blob> {
  let httpParams = new HttpParams()
    .set('fecinicio', params.fecinicio)
    .set('fecfin', params.fecfin);

  if (params?.Grupoid !== undefined && params.Grupoid !== null) {
    httpParams = httpParams.set('Grupoid', String(params.Grupoid));
  }
  if (params?.PropietarioId !== undefined && params.PropietarioId !== null) {
    httpParams = httpParams.set('PropietarioId', String(params.PropietarioId));
  }

  return this._httpClient.get(`${this.reportesBaseUrl}/reportegeneralKARDEX.aspx`, {
    params: httpParams,
    responseType: 'blob',
  });
}

buildInventarioGeneralLegacyUrl(params: { clienteid?: number; grupoid?: number }): string {
  const qp: string[] = [];
  if (params?.clienteid !== undefined && params.clienteid !== null) {
    qp.push(`clienteid=${encodeURIComponent(String(params.clienteid))}`);
  }
  if (params?.grupoid !== undefined && params.grupoid !== null) {
    qp.push(`grupoid=${encodeURIComponent(String(params.grupoid))}`);
  }
  const q = qp.length ? `?${qp.join('&')}` : '';
  return `${this.reportesBaseUrl}/Rep_Inventario.aspx${q}`;
}

buildKardexGeneralLegacyUrl(params: {
  Grupoid?: number;
  PropietarioId?: number;
  fecinicio: string;
  fecfin: string;
}): string {
  const qp: string[] = [
    `fecinicio=${encodeURIComponent(params.fecinicio)}`,
    `fecfin=${encodeURIComponent(params.fecfin)}`,
  ];
  if (params?.Grupoid !== undefined && params.Grupoid !== null) {
    qp.push(`Grupoid=${encodeURIComponent(String(params.Grupoid))}`);
  }
  if (params?.PropietarioId !== undefined && params.PropietarioId !== null) {
    qp.push(`PropietarioId=${encodeURIComponent(String(params.PropietarioId))}`);
  }
  return `${this.reportesBaseUrl}/reportegeneralKARDEX.aspx?${qp.join('&')}`;
}


}
