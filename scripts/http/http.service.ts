import axios from 'axios';

import { CONFIGS } from '@config';

import { HttpAdapter } from './http.adapter';
import { HttpHelper } from './http.helper';
import { ICognitoToken, IHttpServiceOptions } from './interfaces';

export class HttpService {
  public static retryInterval;
  private readonly _token: ICognitoToken;
  private _interval;

  public http: HttpAdapter;
  public readonly options: IHttpServiceOptions;

  public constructor(options: IHttpServiceOptions) {
    this.options = options;
    this._token = options.token;
    this._autoRefreshToken();

    this.http = new HttpAdapter({
      baseURL: options.endpoint,
      headers: {
        authorization: this._token.idToken,
      },
    });
  }

  private _autoRefreshToken(): void {
    this._interval = setInterval(
      this._renewToken.bind(this),
      Math.ceil(this._token.expiresIn * 1000) / 2
    );
  }

  public cleanUp(): void {
    clearInterval(this._interval);
  }

  public async handleRequest(cb: () => any, retryCount: number = 0): Promise<any> {
    try {
      const res = await cb();
      if (HttpService.retryInterval) {
        clearInterval(HttpService.retryInterval);
        HttpService.retryInterval = undefined;
      }
      return res;
    } catch (e) {
      const knownCodes = [
        'EBUSY',
        'EMFILE',
        'EPROTO',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNRESET',
        'ERR_SSL_WRONG_VERSION_NUMBER',
        'ERR_SSL_PACKET_LENGTH_TOO_LONG',
        'ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC',
      ];

      const shouldRetry =
        knownCodes.includes(e.code) ||
        e.response?.status >= 500 ||
        e.response?.status === 401 ||
        e.response?.data.code === 'forbidden';

      if (shouldRetry) {
        if (retryCount >= 10) {
          if (knownCodes.includes(e.code)) {
            console.log({
              step: 'exhaustiveRetry',
              code: e.code,
              status: e.response?.status,
              method: e.config?.method,
              url: e.config?.url,
              data: e.config?.data,
            });

            await HttpHelper.sleep(30000, true);
            return this.handleRequest(cb, 0);
          }
          throw e;
        }

        retryCount += 1;
        console.log({
          step: 'handleRequest',
          retryCount,
          status: e.response?.status,
          method: e.config?.method,
          url: e.config?.url,
          data: e.config?.data,
        });

        if (!HttpService.retryInterval) {
          HttpService.retryInterval = setInterval(() => process.stdout.write('.'), 1000);
        }

        await HttpHelper.sleep(30000 * retryCount);
        if (e.response?.status === 401) {
          await this._renewToken(retryCount);
        }

        return this.handleRequest(cb, retryCount);
      } else {
        if (!e.response) {
          throw e;
        }

        const knownErrorCodes = [
          'group.already_member',
          'group.joining_request.already_sent',
          'data_synchronization.error',
        ];

        if (!knownErrorCodes.includes(e.response.data.code)) {
          console.error('UNKNOWN_ERROR_CODE:');
          console.error(e.response.data);
          throw e;
        }
      }
    }
  }

  public static async getToken(
    username: string,
    password: string,
    options?: { userPool: string; clientId: string },
    retryCount: number = 0
  ): Promise<ICognitoToken> {
    try {
      const res = await axios.post(
        'https://cognito-idp.ap-southeast-1.amazonaws.com',
        {
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
          },
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: options?.clientId || CONFIGS.COGNITO_CLIENT_ID,
        },
        {
          headers: {
            Accept: '*/*',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
            'Content-Type': 'application/x-amz-json-1.1',
          },
        }
      );

      return {
        idToken: res.data.AuthenticationResult.IdToken,
        accessToken: res.data.AuthenticationResult.AccessToken,
        refreshToken: res.data.AuthenticationResult.RefreshToken,
        expiresIn: res.data.AuthenticationResult.ExpiresIn,
        tokenType: res.data.AuthenticationResult.TokenType,
      };
    } catch (e) {
      if (retryCount < 6) {
        await HttpHelper.sleep(3000);
        return HttpService.getToken(username, password, options, (retryCount += 1));
      } else {
        console.error(e.response?.data ?? e.response ?? e);
        throw new Error(`Cannot get token for user: ${username}`);
      }
    }
  }

  private async _renewToken(retryCount: number = 0): Promise<void> {
    try {
      const res = await axios.post(
        'https://cognito-idp.ap-southeast-1.amazonaws.com',
        {
          AuthParameters: {
            REFRESH_TOKEN: this._token.refreshToken,
          },
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: CONFIGS.COGNITO_CLIENT_ID,
        },
        {
          headers: {
            Accept: '*/*',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
            'Content-Type': 'application/x-amz-json-1.1',
          },
        }
      );

      const tokenSet = {
        idToken: res.data.AuthenticationResult.IdToken,
        accessToken: res.data.AuthenticationResult.AccessToken,
      };

      Object.assign(this._token, tokenSet);
      this.http.setHeader({
        authorization: tokenSet.idToken,
      });
    } catch (e) {
      if (retryCount < 6) {
        retryCount++;
        await HttpHelper.sleep(5000 * retryCount);
        await this._renewToken(retryCount);
      } else {
        console.error(e);
        throw new Error(`Cannot refresh token for user: ${this.options.username}`);
      }
    }
  }
}
