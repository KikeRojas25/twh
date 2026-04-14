import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  })
};

@Injectable({ providedIn: 'root' })
export class UbicacionService {

  private readonly baseUrl = environment.baseUrl + '/api/Ubicacion';
  private readonly almacenUrl = environment.baseUrl + '/api/Almacen';
  private readonly _http = inject(HttpClient);

  // ─── Almacenes ───────────────────────────────────────────────────────────────

  getAlmacenes(): Observable<any[]> {
    return this._http.get<any[]>(`${this.almacenUrl}/GetAlmacenes`, httpOptions);
  }

  // ─── TipoArea ────────────────────────────────────────────────────────────────

  getTiposArea(): Observable<any[]> {
    return this._http.get<any[]>(`${this.baseUrl}/tiposareas`, httpOptions);
  }

  // ─── Areas ───────────────────────────────────────────────────────────────────

  getAreas(almacenId?: number): Observable<any[]> {
    const qs = almacenId ? `?almacenId=${almacenId}` : '';
    return this._http.get<any[]>(`${this.baseUrl}/areas${qs}`, httpOptions);
  }

  crearArea(dto: any): Observable<any> {
    return this._http.post<any>(`${this.baseUrl}/areas`, dto, httpOptions);
  }

  actualizarArea(id: number, dto: any): Observable<any> {
    return this._http.put<any>(`${this.baseUrl}/areas/${id}`, dto, httpOptions);
  }

  eliminarArea(id: number): Observable<any> {
    return this._http.delete<any>(`${this.baseUrl}/areas/${id}`, httpOptions);
  }

  // ─── Ubicaciones ─────────────────────────────────────────────────────────────

  getUbicaciones(almacenId?: number, areaId?: number, nombre?: string): Observable<any[]> {
    const params: string[] = [];
    if (almacenId) params.push(`almacenId=${almacenId}`);
    if (areaId) params.push(`areaId=${areaId}`);
    if (nombre?.trim()) params.push(`nombre=${encodeURIComponent(nombre.trim())}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this._http.get<any[]>(`${this.baseUrl}/ubicaciones${qs}`, httpOptions);
  }

  crearUbicacion(dto: any): Observable<any> {
    return this._http.post<any>(`${this.baseUrl}/ubicaciones`, dto, httpOptions);
  }

  actualizarUbicacion(id: number, dto: any): Observable<any> {
    return this._http.put<any>(`${this.baseUrl}/ubicaciones/${id}`, dto, httpOptions);
  }

  eliminarUbicacion(id: number): Observable<any> {
    return this._http.delete<any>(`${this.baseUrl}/ubicaciones/${id}`, httpOptions);
  }

  getInventarioByUbicacion(ubicacionId: number): Observable<any> {
    return this._http.get<any>(`${this.baseUrl}/ubicaciones/${ubicacionId}/inventario`, httpOptions);
  }

  getOcupabilidadPorArea(almacenId: number): Observable<any[]> {
    return this._http.get<any[]>(`${this.baseUrl}/dashboard/ocupabilidad?almacenId=${almacenId}`, httpOptions);
  }

  getOcupabilidadPorPropietario(almacenId: number): Observable<any[]> {
    return this._http.get<any[]>(`${this.baseUrl}/dashboard/ocupabilidad-propietario?almacenId=${almacenId}`, httpOptions);
  }

  getOcupabilidadPorTipoUbicacion(almacenId: number): Observable<any[]> {
    return this._http.get<any[]>(`${this.baseUrl}/dashboard/ocupabilidad-tipo?almacenId=${almacenId}`, httpOptions);
  }
}
