import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { environment } from 'environments/environment';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { User } from '../user/user.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private baseUrl = environment.baseUrl + '/api/auth/';
    private baseUrl2 = environment.baseUrl + '/api/auth/';

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }



    set accessToken2(token: string) {
        localStorage.setItem('accessToken2', token);
    }

    get accessToken2(): string {
        return localStorage.getItem('accessToken2') ?? '';
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }
        //return this._httpClient.post('api/auth/sign-in', credentials).pipe(
        return this._httpClient.post(this.baseUrl + 'login', credentials).pipe(
            switchMap((response: any) => {

            const data = response;

            localStorage.clear();

                //Get and Set menú
             const stringMenu = JSON.stringify(data.menu);
             const stringUser = JSON.stringify(data.user);



             localStorage.setItem('menu', stringMenu);
             localStorage.setItem('token', data.accessToken);
             localStorage.setItem('user', stringUser)
             
             // Crear credenciales adaptadas para el segundo servicio
            const credentials2 = {
                username: credentials.email, // mapeo necesario
                password: credentials.password
            };


            //  return this._httpClient.post(this.baseUrl2 + 'login', credentials2).pipe(
            //     switchMap((response2: any) => {
    
    
            
                       // localStorage.setItem('token_servicio2', response2.token);

                        // Store the access token in the local storage
                        this.accessToken = response.accessToken;


                        // Store the access token in the local storage
                    //    this.accessToken2 = response2.token;
            
                        // Set the authenticated flag to true
                        this._authenticated = true;
            
                        // Store the user on the user service
                        this._userService.user = response.user;
            
                        // Return a new observable with the response
                        return of(response);
                    })
               // );
          //  })
        );
}

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
        // Sign in using the token


       var token = localStorage.getItem('token');
       const getUser =  localStorage.getItem('user');

        

        // Store the access token in the local storage
        this.accessToken = token;

       // Set the authenticated flag to true
        this._authenticated = true;

        // Store the user on the user service
        const userFromStorage: User = JSON.parse(getUser);

        // Asignar al servicio
        this._userService.user = userFromStorage;

        // Return true
        return of(true);

    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');

        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: {
        name: string;
        email: string;
        password: string;
        company: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: {
        email: string;
        password: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }

        // If the access token exists, and it didn't expire, sign in using it
        return this.signInUsingToken();
    }
}
