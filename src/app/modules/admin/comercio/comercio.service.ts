import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { ComercioSearchParams, ComercioSearchResultDto } from './comercio.types';
import { UserService } from 'app/core/user/user.service';
import { JwtHelperService } from '@auth0/angular-jwt';



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
export class ComercioService {

  private _authenticated: boolean = false;
  private _httpClient = inject(HttpClient);
  private _userService = inject(UserService);
  public jwtHelper = new JwtHelperService();
  private decodedToken: any;
  private baseUrl = environment.baseUrl + '/api/Comercio/';

  
   

constructor() { }


searchComercios(searchParams: ComercioSearchParams): Observable<ComercioSearchResultDto[]> {

  return this._httpClient.post<ComercioSearchResultDto[]>(`${this.baseUrl}search`, searchParams, httpOptions);
}


}

