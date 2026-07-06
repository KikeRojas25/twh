import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import {
  Actividad,
  ApiResponse,
  Comunicacion,
  Contacto,
  EntidadDetail,
  EntidadListItem,
  OportunidadCard,
  PagedResult,
  PropietarioWmsRef,
  PropuestaDetail,
  PropuestaSummary,
  Vendedor,
} from '../crm/crm.types';

const httpOptions = {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json',
  }),
};

@Injectable({ providedIn: 'root' })
export class CrmService {
  private baseUrl = environment.baseUrl + '/api/crm/entidades';
  private oportUrl = environment.baseUrl + '/api/crm/oportunidades';
  private comuUrl = environment.baseUrl + '/api/crm/comunicaciones';
  private propUrl = environment.baseUrl + '/api/crm/propuestas';
  private actUrl = environment.baseUrl + '/api/crm/actividades';
  private _httpClient = inject(HttpClient);

  // ─── Entidades ───────────────────────────────────────────────────────────

  getEntidades(
    criterio?: string,
    estado?: string,
    page = 1,
    pageSize = 20,
  ): Observable<PagedResult<EntidadListItem>> {
    const params: string[] = [`page=${page}`, `pageSize=${pageSize}`];
    if (criterio?.trim()) params.push(`criterio=${encodeURIComponent(criterio.trim())}`);
    if (estado?.trim()) params.push(`estado=${encodeURIComponent(estado.trim())}`);
    const qs = `?${params.join('&')}`;
    return this._httpClient.get<PagedResult<EntidadListItem>>(`${this.baseUrl}${qs}`, httpOptions);
  }

  getEntidad(id: number): Observable<ApiResponse<EntidadDetail>> {
    return this._httpClient.get<ApiResponse<EntidadDetail>>(`${this.baseUrl}/${id}`, httpOptions);
  }

  crearEntidad(dto: any): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(this.baseUrl, dto, httpOptions);
  }

  actualizarEntidad(id: number, dto: any): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(`${this.baseUrl}/${id}`, dto, httpOptions);
  }

  eliminarEntidad(id: number): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(`${this.baseUrl}/${id}`, httpOptions);
  }

  // ─── Catálogos para selectores ───────────────────────────────────────────

  /** Usuarios activos, para el selector de vendedor/propietario. */
  getVendedores(): Observable<Vendedor[]> {
    return this._httpClient.get<Vendedor[]>(`${this.baseUrl}/vendedores`, httpOptions);
  }

  /**
   * Búsqueda de propietarios del WMS (clientes operativos), para enlazar la
   * entidad — la bisagra apunta a Mantenimiento.Propietario.
   */
  getPropietariosWms(criterio?: string): Observable<PropietarioWmsRef[]> {
    const qs = criterio?.trim() ? `?criterio=${encodeURIComponent(criterio.trim())}` : '';
    return this._httpClient.get<PropietarioWmsRef[]>(`${this.baseUrl}/propietarios${qs}`, httpOptions);
  }

  // ─── Contactos (anidados bajo entidad) ───────────────────────────────────

  getContactos(entidadId: number): Observable<Contacto[]> {
    return this._httpClient.get<Contacto[]>(`${this.baseUrl}/${entidadId}/contactos`, httpOptions);
  }

  crearContacto(entidadId: number, dto: any): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(`${this.baseUrl}/${entidadId}/contactos`, dto, httpOptions);
  }

  actualizarContacto(contactoId: number, dto: any): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(`${this.baseUrl}/contactos/${contactoId}`, dto, httpOptions);
  }

  eliminarContacto(contactoId: number): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(`${this.baseUrl}/contactos/${contactoId}`, httpOptions);
  }

  // ─── Oportunidades (Fase 2 — pipeline kanban) ────────────────────────────

  getOportunidades(entidadId?: number, propietarioUsuarioId?: number): Observable<OportunidadCard[]> {
    const params: string[] = [];
    if (entidadId) params.push(`entidadId=${entidadId}`);
    if (propietarioUsuarioId) params.push(`propietarioUsuarioId=${propietarioUsuarioId}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this._httpClient.get<OportunidadCard[]>(`${this.oportUrl}${qs}`, httpOptions);
  }

  crearOportunidad(dto: any): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(this.oportUrl, dto, httpOptions);
  }

  actualizarOportunidad(id: number, dto: any): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(`${this.oportUrl}/${id}`, dto, httpOptions);
  }

  /** Mueve la oportunidad de etapa (drag & drop). dto: { etapa, motivoPerdida?, orden? }. */
  moverOportunidad(id: number, dto: any): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(`${this.oportUrl}/${id}/mover`, dto, httpOptions);
  }

  eliminarOportunidad(id: number): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(`${this.oportUrl}/${id}`, httpOptions);
  }

  // ─── Comunicaciones (Fase 3 — timeline) ──────────────────────────────────

  getComunicaciones(entidadId?: number, oportunidadId?: number): Observable<Comunicacion[]> {
    const params: string[] = [];
    if (entidadId) params.push(`entidadId=${entidadId}`);
    if (oportunidadId) params.push(`oportunidadId=${oportunidadId}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this._httpClient.get<Comunicacion[]>(`${this.comuUrl}${qs}`, httpOptions);
  }

  crearComunicacion(dto: any): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(this.comuUrl, dto, httpOptions);
  }

  actualizarComunicacion(id: number, dto: any): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(`${this.comuUrl}/${id}`, dto, httpOptions);
  }

  eliminarComunicacion(id: number): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(`${this.comuUrl}/${id}`, httpOptions);
  }

  // ─── Propuestas + tarifario (Fase 4) ─────────────────────────────────────

  getPropuestas(oportunidadId: number): Observable<PropuestaSummary[]> {
    return this._httpClient.get<PropuestaSummary[]>(`${this.propUrl}?oportunidadId=${oportunidadId}`, httpOptions);
  }

  getPropuesta(id: number): Observable<ApiResponse<PropuestaDetail>> {
    return this._httpClient.get<ApiResponse<PropuestaDetail>>(`${this.propUrl}/${id}`, httpOptions);
  }

  crearPropuesta(dto: any): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(this.propUrl, dto, httpOptions);
  }

  actualizarPropuesta(id: number, dto: any): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(`${this.propUrl}/${id}`, dto, httpOptions);
  }

  nuevaVersionPropuesta(id: number): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(`${this.propUrl}/${id}/version`, {}, httpOptions);
  }

  eliminarPropuesta(id: number): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(`${this.propUrl}/${id}`, httpOptions);
  }

  descargarPropuestaPdf(id: number): Observable<Blob> {
    const headers = new HttpHeaders({ Authorization: 'Bearer ' + localStorage.getItem('token') });
    return this._httpClient.get(`${this.propUrl}/${id}/pdf`, { headers, responseType: 'blob' });
  }

  // ─── Actividades (Fase 5) ────────────────────────────────────────────────

  getActividades(entidadId?: number, oportunidadId?: number): Observable<Actividad[]> {
    const params: string[] = [];
    if (entidadId) params.push(`entidadId=${entidadId}`);
    if (oportunidadId) params.push(`oportunidadId=${oportunidadId}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this._httpClient.get<Actividad[]>(`${this.actUrl}${qs}`, httpOptions);
  }

  crearActividad(dto: any): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(this.actUrl, dto, httpOptions);
  }

  actualizarActividad(id: number, dto: any): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(`${this.actUrl}/${id}`, dto, httpOptions);
  }

  completarActividad(id: number): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(`${this.actUrl}/${id}/completar`, {}, httpOptions);
  }

  reabrirActividad(id: number): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(`${this.actUrl}/${id}/reabrir`, {}, httpOptions);
  }

  eliminarActividad(id: number): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(`${this.actUrl}/${id}`, httpOptions);
  }

  // ─── Conversión al ganar (bisagra) ───────────────────────────────────────

  convertirOportunidad(oportunidadId: number, propietarioWmsId: number): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(`${this.oportUrl}/${oportunidadId}/convertir`, { propietarioWmsId }, httpOptions);
  }
}
