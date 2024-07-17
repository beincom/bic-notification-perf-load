/* eslint-disable @typescript-eslint/ban-ts-comment */
import { check } from 'k6';
import http from 'k6/http';

import { Counter } from 'k6/metrics'; // @ts-ignore
import httpagg from 'k6/x/httpagg'; // @ts-ignore
import { openKv } from 'k6/x/kv';

import { CONFIGS } from '@config';
import { COMMON_CONFIG, PASSWORD, SERVICE } from '@shared/common';

import { StringHelper } from './string.helper';

export const SERVER_DOWN_COUNT = 'server_down_count';
export const REQUEST_TIMEOUT_COUNT = 'request_timeout_count';

const ServerDownCounter = new Counter(SERVER_DOWN_COUNT);
const RequestTimeoutCounter = new Counter(REQUEST_TIMEOUT_COUNT);

interface ApiData {
  token?: string;
  actorUsername: string;
  url: string;
  body?: any;
  headers?: object;
  tags?: object;
}

const sharedStore = openKv();

export const kv: {
  get: (k: string) => Promise<any>;
  set: (k: string, v: any) => Promise<any>;
  clear: () => Promise<any>;
  delete: (k: string) => Promise<any>;
  list: (options?: { prefix?: string; limit?: number }) => Promise<any>;
} = {
  ...sharedStore,
  get: async (k: string) =>
    sharedStore.get(k).catch((e) => {
      if (e.name != 'KeyNotFoundError') {
        throw e;
      }
      return null;
    }),
};

export class HttpHelper {
  public static async getToken(username: string): Promise<string> {
    const res: any = http.post(`${SERVICE.USER.HOST}/auth/login`, {
      email: `${username}@${CONFIGS.EMAIL_DOMAIN}`,
      password: PASSWORD,
    });

    const status = check(res, {
      '[getToken] status is 200': (r) => r.status === 200,
    });

    httpagg.checkRequest(res, status, {
      fileName: 'dashboard/httpagg-getTokenResult.json',
      aggregateLevel: 'onError',
    });

    if (!res?.json()?.data) {
      throw new Error(`Cannot get token for user: ${username}`);
    }

    const token = res.json().data.id_token;
    await kv.set(username, token);
    return token;
  }

  public static POST(data: ApiData): Promise<any> {
    const request = (): any =>
      http.post(data.url, JSON.stringify(data.body), {
        timeout: COMMON_CONFIG.TIMEOUT,
        tags: {
          name: `POST:${StringHelper.replaceUUID(data.url)}`,
        },
        headers: Object.assign(
          {
            'Content-Type': 'application/json',
            authorization: data.token,
            [COMMON_CONFIG.HEADER_KEY.VER]: COMMON_CONFIG.LATEST_VER,
          },
          data.headers
        ) as any,
      });

    return HttpHelper._sendHttpRequest(request, data);
  }

  public static PUT(data: ApiData): Promise<any> {
    const request = (): any =>
      http.put(data.url, JSON.stringify(data.body), {
        timeout: COMMON_CONFIG.TIMEOUT,
        tags: {
          name: `PUT:${StringHelper.replaceUUID(data.url)}`,
        },
        headers: Object.assign(
          {
            'Content-Type': 'application/json',
            authorization: data.token,
            [COMMON_CONFIG.HEADER_KEY.VER]: COMMON_CONFIG.LATEST_VER,
          },
          data.headers
        ) as any,
      });

    return HttpHelper._sendHttpRequest(request, data);
  }

  public static DEL(data: ApiData): Promise<any> {
    const request = (): any =>
      http.del(data.url, JSON.stringify(data.body), {
        timeout: COMMON_CONFIG.TIMEOUT,
        tags: {
          name: `DEL:${StringHelper.replaceUUID(data.url)}`,
        },
        headers: Object.assign(
          {
            'Content-Type': 'application/json',
            authorization: data.token,
            [COMMON_CONFIG.HEADER_KEY.VER]: COMMON_CONFIG.LATEST_VER,
          },
          data.headers
        ) as any,
      });

    return HttpHelper._sendHttpRequest(request, data);
  }

  public static GET(data: ApiData): Promise<any> {
    const request = (): any =>
      http.get(encodeURI(data.url), {
        timeout: COMMON_CONFIG.TIMEOUT,
        tags: {
          name: `${StringHelper.replaceUUID(data.url)}`,
        },
        headers: Object.assign(
          {
            authorization: data.token,
            [COMMON_CONFIG.HEADER_KEY.VER]: COMMON_CONFIG.LATEST_VER,
          },
          data.headers
        ) as any,
      });

    return HttpHelper._sendHttpRequest(request, data);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private static async _sendHttpRequest(request: Function, data: ApiData): Promise<any> {
    data.token =
      (await kv.get(data.actorUsername)) ?? (await HttpHelper.getToken(data.actorUsername));

    const res = request();

    if (res.error_code) {
      if (res.status === 401) {
        data.token = await HttpHelper.getToken(data.actorUsername);
        return HttpHelper._sendHttpRequest(request, data);
      }

      if (res.status === 0) {
        console.log(
          `[Error ${res.error_code}][${res.error}] ${res.request.method} ${res.request.url}`
        );

        if (res.error_code === 1050) {
          RequestTimeoutCounter.add(1);
        }

        if (res.error_code !== 1000) {
          ServerDownCounter.add(1);
        }
      } else {
        console.error(res.body);
        ServerDownCounter.add(1);
      }

      return res;
    }

    return res.json();
  }
}
