import { ORDER } from '@beincom/constants';
import axios from 'axios';

import { CONFIGS } from '../../config';

import { HttpAdapter } from './http.adapter';

interface ICognitoToken {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface IHttpServiceOption {
  apiEndpoint?: string;
  token: ICognitoToken;
  username: string;
  password?: string;
}

export type QueryParams = {
  key?: string;
  offset?: number;
  limit?: number;
  sort?: Array<[any, ORDER]>;
  cursor?: string;
};

class HttpService {
  public static retryInterval;
  private readonly _token: ICognitoToken;
  private interval;

  public http: HttpAdapter;
  public readonly options: IHttpServiceOption;

  public constructor(options: IHttpServiceOption) {
    this.options = options;
    this._token = options.token;
    this.autoRefreshToken();

    this.http = new HttpAdapter({
      baseURL: options.apiEndpoint,
      headers: {
        authorization: this._token.idToken,
      },
    });
  }

  private autoRefreshToken(): void {
    this.interval = setInterval(
      this.refreshToken.bind(this),
      Math.ceil(this._token.expiresIn * 1000) / 2
    );
  }

  public cleanUp(): void {
    clearInterval(this.interval);
  }

  public async sendRequestAndRetry(cb, retryCount: number = 0): Promise<any> {
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
            await randomSleep(30000);
            return this.sendRequestAndRetry(cb, 0);
          }
          throw e;
        }

        retryCount += 1;
        console.log({
          step: 'sendRequestAndRetry',
          retryCount,
          status: e.response?.status,
          method: e.config?.method,
          url: e.config?.url,
          data: e.config?.data,
        });
        if (!HttpService.retryInterval) {
          HttpService.retryInterval = setInterval(() => process.stdout.write('.'), 1000);
        }

        await sleep(30000 * retryCount);

        if (e.response?.status === 401) {
          await this.refreshToken(retryCount);
        }

        return this.sendRequestAndRetry(cb, retryCount);
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
        await sleep(3000);
        return HttpService.getToken(username, password, options, (retryCount += 1));
      } else {
        console.error(e.response?.data ?? e.response ?? e);
        throw new Error(`Cannot get token for user: ${username}`);
      }
    }
  }

  private async refreshToken(retryCount: number = 0): Promise<void> {
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
      const newToken = {
        idToken: res.data.AuthenticationResult.IdToken,
        accessToken: res.data.AuthenticationResult.AccessToken,
      };

      Object.assign(this._token, newToken);
      this.http.setHeader({
        authorization: newToken.idToken,
      });
    } catch (e) {
      if (retryCount < 6) {
        retryCount++;
        await sleep(5000 * retryCount);
        await this.refreshToken(retryCount);
      } else {
        console.error(e);
        throw new Error(`Cannot refresh token for user: ${this.options.username}`);
      }
    }
  }
}

export type IUser = {
  id: string;
  username: string;
  email: string;
  password?: string;
  isAdmin?: boolean;
};

export type Community = {
  id: string;
  name: string;
  privacy: string;
  group_id: string;
  owner_id: string;
};

export class User extends HttpService {
  public username: string;
  public constructor(options: IHttpServiceOption) {
    super(options);
    this.username = options.username;
  }

  public static async init(options: Omit<IHttpServiceOption, 'token'>): Promise<User> {
    const token = await HttpService.getToken(
      options.username,
      options.password ?? CONFIGS.DEFAULT_PASSWORD,
      {
        clientId: CONFIGS.COGNITO_CLIENT_ID,
        userPool: CONFIGS.COGNITO_USER_POOL,
      }
    );

    options.apiEndpoint = options.apiEndpoint ?? CONFIGS.API_ENDPOINT;
    return new User({ ...options, token });
  }

  public async joinGroup(groupId: string): Promise<void> {
    return this.sendRequestAndRetry(async () =>
      this.http.post(
        `group/groups/${groupId}/join`,
        {},
        {
          headers: {
            'x-version-id': '1.1.0',
          },
        }
      )
    );
  }

  public async approveAllJoinRequests(groupId: string): Promise<void> {
    try {
      return this.sendRequestAndRetry(async () =>
        this.http.put(`group/groups/${groupId}/join-requests/approve`, {})
      );
    } catch (e) {
      console.error('approveAllJoinRequests', e.response.data);
      throw new Error(`Cannot approve all join requests in group id: ${groupId}`);
    }
  }

  public async declineAllJoinRequests(groupId: string): Promise<void> {
    try {
      return this.sendRequestAndRetry(async () =>
        this.http.put(`group/groups/${groupId}/join-requests/decline`, {})
      );
    } catch (e) {
      console.error('declineAllJoinRequests', e.response.data);
      throw new Error(`Cannot decline all join requests in group id: ${groupId}`);
    }
  }

  public async createDraftPost(groupIds: string[]): Promise<{ id: string }> {
    try {
      const res = await this.sendRequestAndRetry(async () =>
        this.http.post(
          'content/posts',
          { audience: { group_ids: groupIds } },
          { headers: { 'x-version-id': '1.12.0' } }
        )
      );
      return res.data.data;
    } catch (e) {
      console.error('createDraftPost', e.response.data);
      throw new Error(`Cannot create draft post in group ids: ${groupIds.join(', ')}`);
    }
  }

  public async publishPost(postId: string, content: string): Promise<void> {
    try {
      return this.sendRequestAndRetry(async () =>
        this.http.put(
          `content/posts/${postId}/publish`,
          { content },
          { headers: { 'x-version-id': '1.12.0' } }
        )
      );
    } catch (e) {
      console.error('publishPost', e.response.data);
      throw new Error(`Cannot publish post: ${postId}`);
    }
  }

  public async getTimeline(groupId: string, after?: string): Promise<any> {
    try {
      const response = await this.sendRequestAndRetry(async () =>
        this.http.get(`/content/timeline/${groupId}?limit=20${after ? `&after=${after}` : ''}`, {
          headers: { 'x-version-id': '1.14.0' },
        })
      );
      return response.data.data;
    } catch (error) {
      console.error('getTimeline', error.response.data);
      throw new Error(`Cannot get timeline for group: ${groupId}`);
    }
  }
}

export class SysAdmin extends User {
  public constructor(options: IHttpServiceOption) {
    super(options);
  }

  public static async init(): Promise<SysAdmin> {
    const token = await HttpService.getToken(CONFIGS.SYS_ADMIN_USER_NAME, CONFIGS.DEFAULT_PASSWORD);
    return new SysAdmin({
      username: CONFIGS.SYS_ADMIN_USER_NAME,
      password: CONFIGS.DEFAULT_PASSWORD,
      apiEndpoint: CONFIGS.API_ENDPOINT,
      token,
    });
  }

  public async findCommunityByName(name: string): Promise<Community> {
    try {
      const res = await this.http.get('/group/admin/communities', {
        params: {
          key: name,
          offset: 0,
          limit: 10,
          sort: 'name:asc',
        },
      });

      return res.data.data.find((community: any) => community.name === name);
    } catch (e) {
      console.error('findCommunityByName', e.response.data);
      throw new Error(`Cannot find the community with name: ${name}`);
    }
  }

  public async getCommunityMembers(communityId: string, limit: number = 10): Promise<IUser[]> {
    try {
      const res = await this.http.get(`/group/admin/communities/${communityId}/members`, {
        params: {
          limit,
        },
      });

      return res.data.data;
    } catch (e) {
      console.error('getCommunityMembers', e.response.data);
      throw new Error(`Cannot get the community members with community id: ${communityId}`);
    }
  }

  public async findUserById(userId: string): Promise<IUser> {
    try {
      const res = await this.http.get(`/user/admin/users/${userId}/profile`);

      return res.data.data;
    } catch (e) {
      console.error('findUserById', e.response.data);
      throw new Error(`Cannot get the user profile with user id: ${userId}`);
    }
  }
}

export function sleep(milliseconds: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, milliseconds);
  });
}

export async function randomSleep(ms: number = 10000): Promise<number> {
  const duration = Math.floor(Math.random() * ms);
  await new Promise((r) => setTimeout(r, duration));
  return duration;
}
