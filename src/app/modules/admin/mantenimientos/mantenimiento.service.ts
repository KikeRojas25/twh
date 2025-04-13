import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, Observable, throwError } from 'rxjs';










const httpOptions = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
    'Content-Type' : 'application/json'
  }),
};






@Injectable({
  providedIn: 'root'
})
export class MantenimientoService {

private baseUrl = environment.baseUrl + '/api/general/';

constructor(private http: HttpClient) { 
}


GetAllProveedor(): Observable<any[]> {
   return this.http.get<any[]>(this.baseUrl + 'GetAllProveedor', httpOptions);
 }


 GetAllVehiculos(): Observable<any[]> {
  return this.http.get<any[]>(this.baseUrl + 'GetAllVehiculo', httpOptions);
}

guardarVehiculo(vehiculo: any): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}RegistrarVehiculo`, vehiculo).pipe(
    catchError(err => {
      console.error('Error desde el servicio:', err);
      return throwError(() => err);
    })
  );
  


}
actualizarVehiculo(id: number, vehiculo: any): Observable<any> {
  return this.http.put<any>(`${this.baseUrl}ActualizarVehiculo/${id}`, vehiculo);
}

getVehiculoById(id: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}GetVehiculoById/${id}`);
}

verificarPlaca(placa: string): Observable<boolean> {
  return this.http.get<boolean>(`${this.baseUrl}existeplaca/${placa}`);
}

eliminarVehiculo(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}EliminarVehiculo/${id}`);
}

}
