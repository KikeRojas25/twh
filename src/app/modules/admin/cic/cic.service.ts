import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';



const httpOptions = {
  headers: new HttpHeaders({
    Authorization : 'Bearer ' + localStorage.getItem('token'),
    'Content-Type' : 'application/json'
  }),
      responseType: 'blob' // Configura para recibir un archivo
  // , observe: 'body', reportProgress: true };
};
const httpOptionsUpload = {
  headers: new HttpHeaders({
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }),
  responseType: 'blob' // Configura para recibir un archivo
};



@Injectable({
  providedIn: 'root'
})
export class CicService {

  private _httpClient = inject(HttpClient);
  private baseUrl = environment.baseUrl + '/api/Cic/';


constructor() { }

uploadFile(usrid: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const httpOptionsUpload = {
    headers: new HttpHeaders({
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    })
  };

  // Aquí especificamos responseType en la llamada al método post
  return this._httpClient.post(`${this.baseUrl}UploadFile?usrid=${usrid}`, formData, {
    ...httpOptionsUpload, // Desestructuramos httpOptionsUpload
    responseType: 'blob'   // Añadimos responseType aquí
  });
}
}
