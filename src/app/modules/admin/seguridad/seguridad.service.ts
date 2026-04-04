import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json ; charset=utf-8',
  }),
};

@Injectable({
  providedIn: 'root'
})
export class SeguridadService {
  private baseUrl = environment.baseUrl + '/api/Users';
  private _httpClient = inject(HttpClient);

  getAll(): Observable<any[]> {
    return this._httpClient.get<any[]>(`${this.baseUrl}`, httpOptions);
  }

  getById(id: number): Observable<any> {
    return this._httpClient.get<any>(`${this.baseUrl}/${id}`, httpOptions);
  }

  register(data: any): Observable<any> {
    return this._httpClient.post<any>(`${this.baseUrl}/register`, data, httpOptions);
  }

  update(data: any): Observable<any> {
    return this._httpClient.post<any>(`${this.baseUrl}/update`, data, httpOptions);
  }

  toggleEstado(id: number): Observable<any> {
    return this._httpClient.post<any>(`${this.baseUrl}/toggleestado/${id}`, {}, httpOptions);
  }

  changePassword(id: number, password: string): Observable<any> {
    return this._httpClient.post<any>(`${this.baseUrl}/changepassword`, { Id: id, Password: password }, httpOptions);
  }

  getUserRoles(userId: number): Observable<any[]> {
    return this._httpClient.get<any[]>(`${this.baseUrl}/${userId}/roles`, httpOptions);
  }

  getAllRoles(): Observable<any[]> {
    return this._httpClient.get<any[]>(`${environment.baseUrl}/api/Roles`, httpOptions);
  }

  saveUserRoles(userId: number, roles: any[]): Observable<any> {
    const payload = roles.map(r => ({ UserId: userId, Alias: r.alias }));
    return this._httpClient.post<any>(`${environment.baseUrl}/api/Roles/addroluser?UserId=${userId}`, payload, httpOptions);
  }
}
