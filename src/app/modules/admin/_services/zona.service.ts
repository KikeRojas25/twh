import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json',
  }),
};

@Injectable({ providedIn: 'root' })
export class ZonaService {
  private readonly baseUrl = environment.baseUrl + '/api/Zonas';
  private readonly reporteUrl = environment.baseUrl + '/api/Reporte';
  private readonly _http = inject(HttpClient);

  // ─── Zonas (CRUD) ──────────────────────────────────────────────────────────

  getZonas(almacenId?: number): Observable<any[]> {
    const qs = almacenId ? `?almacenId=${almacenId}` : '';
    return this._http.get<any[]>(`${this.baseUrl}${qs}`, httpOptions);
  }

  getZonaUbicaciones(zonaId: number): Observable<any[]> {
    return this._http.get<any[]>(`${this.baseUrl}/${zonaId}/ubicaciones`, httpOptions);
  }

  crearZona(dto: any): Observable<any> {
    return this._http.post<any>(`${this.baseUrl}`, dto, httpOptions);
  }

  actualizarZona(id: number, dto: any): Observable<any> {
    return this._http.put<any>(`${this.baseUrl}/${id}`, dto, httpOptions);
  }

  eliminarZona(id: number): Observable<any> {
    return this._http.delete<any>(`${this.baseUrl}/${id}`, httpOptions);
  }

  /** Vincula (asigna) ubicaciones a una zona. */
  asignarUbicaciones(zonaId: number, ubicacionIds: number[]): Observable<any> {
    return this._http.post<any>(`${this.baseUrl}/${zonaId}/ubicaciones`, { ubicacionIds }, httpOptions);
  }

  /** Desvincula (quita) ubicaciones de una zona; quedan sin zona. */
  quitarUbicaciones(zonaId: number, ubicacionIds: number[]): Observable<any> {
    return this._http.request<any>('delete', `${this.baseUrl}/${zonaId}/ubicaciones`, {
      ...httpOptions,
      body: { ubicacionIds },
    });
  }

  asignarPropietarios(zonaId: number, propietarios: { propietarioId: number; prioridad?: number }[]): Observable<any> {
    return this._http.post<any>(`${this.baseUrl}/${zonaId}/propietarios`, { propietarios }, httpOptions);
  }

  quitarPropietario(zonaId: number, propietarioId: number): Observable<any> {
    return this._http.delete<any>(`${this.baseUrl}/${zonaId}/propietarios/${propietarioId}`, httpOptions);
  }

  /**
   * Puente Analítica → Zonas: reserva ubicaciones en una zona según la proyección del cliente.
   * Con commit=false devuelve una simulación (para previsualizar); commit=true confirma.
   */
  reservarPorProyeccion(dto: {
    propietarioId: number; almacenId: number;
    zonaId?: number; codigoZona?: string; nombreZona?: string;
    areas?: string; tipoUbicacionId?: number; cantidad?: number; periodo?: string;
    commit: boolean;
  }): Observable<any> {
    return this._http.post<any>(`${this.baseUrl}/reservar-por-proyeccion`, dto, httpOptions);
  }

  // ─── Reporte 3D por zona ───────────────────────────────────────────────────

  getZonas3d(almacenId?: number, areaId?: number): Observable<any[]> {
    const params: string[] = [];
    if (almacenId) params.push(`almacenId=${almacenId}`);
    if (areaId) params.push(`areaId=${areaId}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this._http.get<any[]>(`${this.reporteUrl}/zonas3d${qs}`, httpOptions);
  }
}
