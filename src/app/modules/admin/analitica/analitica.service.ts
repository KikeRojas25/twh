import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import {
    AbcProductoResponse,
    CriterioAbc,
    InventarioClienteResponse,
    ParetoClientesResponse,
    ProyeccionAlmacenResponse,
    ProyeccionResponse,
} from './analitica.types';

@Injectable({ providedIn: 'root' })
export class AnaliticaService {
    // El authInterceptor ya agrega el Bearer: no hace falta armar headers a mano.
    private _http = inject(HttpClient);
    private _api = environment.baseUrl + '/api/analitica';

    /** Proyección mensual de posiciones ocupadas. meses: 1 | 3 | 6 | 9 | 12 */
    getProyeccion(propietarioId: number, meses: number): Observable<ProyeccionResponse> {
        const params = new HttpParams()
            .set('propietarioId', String(propietarioId))
            .set('meses', String(meses));

        return this._http.get<ProyeccionResponse>(`${this._api}/proyeccion`, { params });
    }

    /** Ocupación total del almacén (suma de los clientes vigentes). Para el dashboard. */
    getProyeccionAlmacen(meses: number): Observable<ProyeccionAlmacenResponse> {
        const params = new HttpParams().set('meses', String(meses));

        return this._http.get<ProyeccionAlmacenResponse>(`${this._api}/proyeccion-almacen`, { params });
    }

    /** Productos de un cliente por ubicaciones ocupadas. */
    getInventarioCliente(
        propietarioId: number,
        clasificacion?: string,
        fecha?: string,
    ): Observable<InventarioClienteResponse> {
        let params = new HttpParams().set('propietarioId', String(propietarioId));
        if (clasificacion) { params = params.set('clasificacion', clasificacion); }
        if (fecha) { params = params.set('fecha', fecha); }

        return this._http.get<InventarioClienteResponse>(`${this._api}/inventario-cliente`, { params });
    }

    /** Pareto de clientes por ubicaciones ocupadas. */
    getParetoClientes(fecha?: string): Observable<ParetoClientesResponse> {
        let params = new HttpParams();
        if (fecha) { params = params.set('fecha', fecha); }

        return this._http.get<ParetoClientesResponse>(`${this._api}/pareto-clientes`, { params });
    }

    /** ABC por producto. dias: 30 | 90 | 180 | 365 */
    getAbcProducto(propietarioId: number, criterio: CriterioAbc, dias: number): Observable<AbcProductoResponse> {
        const params = new HttpParams()
            .set('propietarioId', String(propietarioId))
            .set('criterio', criterio)
            .set('dias', String(dias));

        return this._http.get<AbcProductoResponse>(`${this._api}/abc-producto`, { params });
    }

    /** Recalcula y persiste el ABC del cliente para ese período (botón "Actualizar"). */
    recalcularAbcProducto(propietarioId: number, dias: number): Observable<unknown> {
        const params = new HttpParams()
            .set('propietarioId', String(propietarioId))
            .set('dias', String(dias));

        return this._http.post(`${this._api}/abc-producto/recalcular`, {}, { params });
    }

    /** Informe ABC de una página en PDF (para entregar al cliente). Devuelve el archivo como blob. */
    descargarAbcPdf(propietarioId: number, criterio: CriterioAbc, dias: number): Observable<HttpResponse<Blob>> {
        const params = new HttpParams()
            .set('propietarioId', String(propietarioId))
            .set('criterio', criterio)
            .set('dias', String(dias));

        return this._http.get(`${this._api}/abc-producto/pdf`, {
            params, observe: 'response', responseType: 'blob',
        });
    }
}
