import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { environment } from '../environments/environment';
import { SessionService } from './session.service';
import { Router } from '@angular/router';
//import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private http: HttpClient, 
    private session: SessionService,
    private router: Router
    ) { 
    }
  
  
  getWindow() {
    return window;
  }
  
  getDocument() {
    return document;
  }
  
  // A redirect to the Open Auth protocol endpoint to initiate the user authentication with the TelCo
  authenticateRedirect() {

    if (!this.session.gameSettings || !this.session.gameSettings.maintenance || this.session.gameSettings.maintenance.siteDown || this.session.gameSettings.maintenance.noGames)
      this.router.navigate(['/home']);
    else {
      const url = encodeURI(`${environment.mtsAuthDomainProtocol}://${environment.mtsAuthDomainUrl}/amserver/oauth2/auth?client_id=${environment.mtsAuthClientId}&scope=openid profile mobile&redirect_uri=${environment.mtsAuthCallbackUrl}&response_type=code&display=page&state=1`);
     
      window.location.href = url;
    }
  }
  
  
  // A redirect to the Open Auth protocol endpoint to initiate the user authentication with the TelCo
  logoutRedirect() {
    
      const home = environment.mtsAuthCallbackUrl.replace(/\/auth-callback/, '');

      const url = encodeURI(`${environment.mtsAuthDomainProtocol}://${environment.mtsAuthDomainUrl}/amserver/UI/Logout?goto=${home}`);
     
      window.location.href = url;
  }
  
  
  logout() {
    if (!this.session.mtsToken)
      console.error('Logout failed, missing user token');
    
    const url = encodeURI(`${environment.mtsAuthDomainProtocol}://${environment.mtsAuthDomainUrl}/amserver/oauth2/revoke?token=${this.session.mtsToken}`);

    return this.http.post(url, {
      headers: { 'Accept': '*/*', 'Access-Control-Allow-Origin': '*', 'Authorization': 'Bearer ' + this.session.mtsToken }
    });
    
  }

  
  authenticateUserToken(code) {
    
    const url = encodeURI(`${environment.gameServerDomainUrl}/api/mts/${code}`);

    return this.http.get(url, {
      headers: { 'Accept': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  
  // A call to the user status service to get user subscription status and basic data
  authorizeUser() {
    
    const url = `${environment.gameServerDomainUrl}/api/user/signup`;
    
    return this.http.post(url, { msisdn: this.session.msisdn }, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      observe: 'response'
    });
  }
    
    
  fetchGameSettings() {
    
    const url = `${environment.gameServerDomainUrl}/api/settings/game`;
      
    return this.http.get(url, {
      headers: { 'Accept': 'application/json', 'Access-Control-Allow-Origin': '*' }
    }).toPromise();
  }
    
    
  getWinners() {
    
    const url = `${environment.gameServerDomainUrl}/api/prize-winners`;
      
    return this.http.get(url, {
      headers: { 'Accept': 'application/json', 'Access-Control-Allow-Origin': '*' }
    }).toPromise();
  }


  getUserProfile() {
    
    const url = `${environment.gameServerDomainUrl}/api/user`;
      
    return this.http.get<User>(url, {
      headers: { 
        'Accept': 'application/json', 
        'Access-Control-Allow-Origin': '*', 
        'X-Access-Token': this.session.token 
      }
    }).toPromise();
  }
  
  
  saveUserProfile(newProfileObject) {
    
    let promise = new Promise((resolve, reject) => {
      
      if (!this.session || !this.session.token)
        return reject(new Error('Invalid user data to update'));
        
      const url = `${environment.gameServerDomainUrl}/api/user`;
      const objectToSave = newProfileObject; //this.session.user.toProfileDTO();
        
      return this.http.put(url, objectToSave, {
        headers: { 
          'Accept': 'application/json', 
          'Access-Control-Allow-Origin': '*', 
          'X-Access-Token': this.session.token,
          'Content-Type': 'application/json', 
          },
        observe: 'response'
      }).toPromise().then( 
        res => {
          const token = res.headers.get('X-Access-Token');
          if (token)
            this.session.token = token;
          
          const body:any = res.body;
          resolve(body);
        },
        err => {
          reject(err);
        });
    });
    
    return promise;
  }
  
  
  transferCashback() {
    
    let promise = new Promise((resolve, reject) => {
      
      if (!this.session || !this.session.token)
        return reject(new Error('Invalid user data to update'));
        
      const url = `${environment.gameServerDomainUrl}/api/user/cashback`;
      const objectToSave = {};
        
      return this.http.post(url, objectToSave, {
        headers: { 
          'Accept': 'application/json', 
          'Access-Control-Allow-Origin': '*', 
          'X-Access-Token': this.session.token,
          'Content-Type': 'application/json', 
          },
        observe: 'response'
      }).toPromise().then( 
        res => {
          const token = res.headers.get('X-Access-Token');
          if (token)
            this.session.token = token;
          
          const body:any = res.body;
          resolve(body);
        },
        err => {
          reject(err);
        });
    });
    
    return promise;
  }
  
  
  unsubscribe() {
    
    let promise = new Promise((resolve, reject) => {
      
      if (!this.session || !this.session.token)
        return reject(new Error('Invalid user data to update'));
        
      const url = `${environment.gameServerDomainUrl}/api/user`;

      return this.http.delete(url, {
        headers: { 
          'Accept': 'application/json', 
          'Access-Control-Allow-Origin': '*', 
          'X-Access-Token': this.session.token
          },
        observe: 'response'
      }).toPromise().then( 
        res => {
          const token = res.headers.get('X-Access-Token');
          if (token)
            this.session.token = token;
          
          const body:any = res.body;
          resolve(body);
        },
        err => {
          reject(err);
        });
    });
    
    return promise;
  }
  
    
  // A call to create a new session for the user and prefetch a bunch of session questions (no answers)
  // How to work with Promises with Angular HttpClient: https://codecraft.tv/courses/angular/http/http-with-promises/
  createSession(gameType) {
      
    let promise = new Promise((resolve, reject) => {
      gameType = gameType || 'demo';
      
      const url = `${environment.gameServerDomainUrl}/api/${gameType === 'normal' ? '' : (gameType === 'demo' ? 'demo-' : 'timefree-')}session/swipewin`;
  
      return this.http.post(url, { }, {
        headers: { 
          'Accept': 'application/json', 
          'Content-Type': 'application/json', 
          'X-Access-Token': this.session.token || (new Date).getTime().toString(),
          'Access-Control-Allow-Origin': '*'
          },
        observe: 'response'
      }).toPromise().then(
        res => { // Success
        
          const token = res.headers.get('X-Access-Token');
          if (token)
            this.session.token = token;
          
          const body:any = res.body;

          // Get the new session's id and keep it
          this.session.currentSessionId = body.ticket.id;

          resolve(body);
        },
        err => { // Error
          const status: number = err.status;
          
          if (err.error && err.error.errorCode) 
            this.router.navigate(['home'], { queryParams: { errorCode: err.error.errorCode } })
            
          reject(err);
        }
      );
    });
    
    return promise;
  }
    
    
  // A call to register the user answer of a question to the server 
  answerQuestion(questionId, answer, gameType) {
    
    let promise = new Promise((resolve, reject) => {
      gameType = gameType || 'demo';
  
      const url = `${environment.gameServerDomainUrl}/api/${gameType === 'normal' ? '' : (gameType === 'demo' ? 'demo-' : 'timefree-')}session/swipewin/${this.session.currentSessionId}`;
      
      const body = {
                sessionId: this.session.currentSessionId,
                questionId: questionId,
                userAnswer: answer.toString()
            };
  
      return this.http.post(url, body, {
        headers: { 
          'Accept': 'application/json', 
          'Content-Type': 'application/json', 
          'X-Access-Token': this.session.token || (new Date).getTime().toString(),
          'Access-Control-Allow-Origin': '*'
          },
        observe: 'response'
      }).toPromise().then(
        res => { // Success
        
          const token = res.headers.get('X-Access-Token');
          if (token)
            this.session.token = token;
          
          // Deserialize payload
          const body:any = res.body; // JSON.parse(response);
          
          // Detect the session termination, in this case wait for 1 sec for the end cards animation
          if (body.sessionResult) {
            this.session.lastGameResults = body.sessionResult;
            this.session.Serialize();
            timer(1000).subscribe(() => gameType === 'normal' ? this.router.navigate(['result']) : gameType === 'demo' ? this.router.navigate(['resultdemo']) : this.router.navigate(['resultfreetime']));
          }

          resolve(body);
        },
        err => { // Error
          const status: number = err.status;
          
          if (err.error && err.error.errorCode) 
            this.router.navigate(['home'], { queryParams: { errorCode: err.error.errorCode } })
            
          reject(err);
        }
      );
    });
    
    return promise;
  }
  
}
