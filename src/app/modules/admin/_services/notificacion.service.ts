import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

export interface NotificacionEventoDto {
  id: number;
  codigo: string;
  descripcion: string;
  ordenVisual: number;
  suscrito: boolean;
}

export interface NotificacionCorreoDto {
  id: number;
  tipo: 'Propietario' | 'Ejecutivo' | string;
  correo: string;
}

export interface PropietarioNotificacionDto {
  propietarioId: number;
  propietarioNombre: string;
  eventos: NotificacionEventoDto[];
  correos: NotificacionCorreoDto[];
}

const httpOptions = {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json',
  }),
};

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private baseUrl = environment.baseUrl + '/api/Notificacion';
  private http = inject(HttpClient);

  getConfigPropietario(propietarioId: number): Observable<PropietarioNotificacionDto> {
    return this.http.get<PropietarioNotificacionDto>(
      `${this.baseUrl}/propietario/${propietarioId}`,
      httpOptions,
    );
  }

  toggleEvento(propietarioId: number, eventoId: number, habilitado: boolean): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/propietario/${propietarioId}/evento/${eventoId}`,
      { habilitado },
      httpOptions,
    );
  }

  agregarCorreo(propietarioId: number, tipo: string, correo: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      `${this.baseUrl}/propietario/${propietarioId}/correo`,
      { tipo, correo },
      httpOptions,
    );
  }

  eliminarCorreo(correoId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/correo/${correoId}`, httpOptions);
  }
}
