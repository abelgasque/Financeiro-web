import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { JwtHelperService } from '@auth0/angular-jwt';

import { environment } from '../../environments/environment';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  oauthTokenUrl: string;
  jwtPayload: any;

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private router: Router) 
  {
    this.oauthTokenUrl = `${environment.apiUrl}/oauth/token`;
    this.carregarToken();
  }

  login(usuario: string, senha: string): Promise<void> {
    const headers = new HttpHeaders()
      .append('Content-Type', 'application/x-www-form-urlencoded')
      .append('Authorization', 'Basic YW5ndWxhcjpAbmd1bEByMA==');

    const body = `username=${usuario}&password=${senha}&grant_type=password`;

    return this.http.post<any>(this.oauthTokenUrl, body, { headers, withCredentials: true })
    .toPromise()
    .then(response => {
      this.armazenarToken(response.access_token);
    })
    .catch(response => {
      console.log(response);
      
      if (response.status === 400) {
        if (response.error.error === 'invalid_grant') {
          return Promise.reject('Usuário ou senha inválida!');
        }
      }

      return Promise.reject(response);
    });
  }

  obterNovoAccessToken(): Promise<void> {
    const headers = new HttpHeaders()
      .append('Content-Type', 'application/x-www-form-urlencoded')
      .append('Authorization', 'Basic YW5ndWxhcjpAbmd1bEByMA==');

    const body = 'grant_type=refresh_token';

    return this.http.post<any>(this.oauthTokenUrl, body, { headers, withCredentials: true })
    .toPromise()
    .then(response => {
      this.armazenarToken(response.access_token);

      console.log('Novo access token criado!');

      return Promise.resolve(null);
    })
    .catch(response => {
      this.router.navigate(['/seguranca','login-autenticacao']);
      console.error('Erro ao renovar token.', response);
      return Promise.resolve(null);
    });
  }

  limparAccessToken() {
    localStorage.removeItem("access_token");
    this.jwtPayload = null;
  }

  isAccessTokenInvalido() {
    const token = localStorage.getItem("access_token");

    return !token || this.jwtHelper.isTokenExpired(token);
  }

  temPermissao(permissao: string) {
    return this.jwtPayload && this.jwtPayload.authorities.includes(permissao);
  }

  temQualquerPermissao(roles) {
    for (const role of roles) {
      if (this.temPermissao(role)) {
        return true;
      }
    }

    return false;
  }

  private armazenarToken(token: string) {
    this.jwtPayload = this.jwtHelper.decodeToken(token);
    localStorage.setItem("access_token", token);
  }

  private carregarToken() {
    const token = localStorage.getItem("access_token");

    if (token) {
      this.armazenarToken(token);
    }
  }
}

