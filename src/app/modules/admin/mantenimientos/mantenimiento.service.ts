import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
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
private baseUrlConductor = environment.baseUrl + '/api/Conductor/';
private baseUrlVehiculo = environment.baseUrl + '/api/Vehiculo/';


private baseUrlSalida = environment.baseUrl + '/api/ordensalida/';


constructor(private http: HttpClient) { 
}


GetAllProveedor(): Observable<any[]> {
   return this.http.get<any[]>(this.baseUrl + 'GetAllProveedor', httpOptions);
 }


 getAllVehiculos(placa: string): Observable<any[]> {
  return this.http.get<any[]>(this.baseUrlVehiculo + 'GetAllVehiculo?placa=' +  placa, httpOptions);
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




getAllConductores(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrlConductor}GetAll` , httpOptions);
}


registrarEquipoTransporte(IdsShipment: number, IdTraco: number, IdCarreta: number, IdConductor: number, idtipo: any) {

console.log('acaestoy', IdsShipment);


  const dto =  {
    ChoferId: IdConductor,
    VehiculoId: IdTraco,
    ids: IdsShipment,
  };


  return this.http.post<any>(`${this.baseUrlSalida}GenerarShipment`, dto, httpOptions)
  .pipe(
    catchError(this.handleError)
  );

}

private handleError(error: HttpErrorResponse) {
  if (error.error instanceof ErrorEvent) {
    // Error del lado del cliente o de red
    console.error('Ocurrió un error:', error.error.message);
  } else {
    // El backend devolvió un código de error
    console.error(
      `Backend retornó el código ${error.status}, ` +
      `body was: ${JSON.stringify(error.error)}`);
  }
  // Retorna un observable con un mensaje de error
  return throwError('Algo salió mal; por favor, intenta de nuevo más tarde.');
}




}
