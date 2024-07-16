/* eslint-disable @typescript-eslint/ban-ts-comment */
import { check } from 'k6';
import http from 'k6/http';

import { Counter } from 'k6/metrics'; // @ts-ignore
import httpagg from 'k6/x/httpagg'; // @ts-ignore
import { openKv } from 'k6/x/kv';

import { CONFIGS } from '../../config';
import { COMMON_CONFIG, SERVICE, PASSWORD } from '../common';

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

export async function getToken(username: string): Promise<string> {
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

export function POST(data: ApiData): Promise<any> {
  const request = (): any =>
    http.post(data.url, JSON.stringify(data.body), {
      timeout: COMMON_CONFIG.TIMEOUT,
      tags: {
        name: `POST:${stripId(data.url)}`,
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

  return sendHttpRequest(request, data);
}

export function PUT(data: ApiData): Promise<any> {
  const request = (): any =>
    http.put(data.url, JSON.stringify(data.body), {
      timeout: COMMON_CONFIG.TIMEOUT,
      tags: {
        name: `PUT:${stripId(data.url)}`,
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

  return sendHttpRequest(request, data);
}

export function DEL(data: ApiData): Promise<any> {
  const request = (): any =>
    http.del(data.url, JSON.stringify(data.body), {
      timeout: COMMON_CONFIG.TIMEOUT,
      tags: {
        name: `DEL:${stripId(data.url)}`,
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

  return sendHttpRequest(request, data);
}

export function GET(data: ApiData): Promise<any> {
  const request = (): any =>
    http.get(encodeURI(data.url), {
      timeout: COMMON_CONFIG.TIMEOUT,
      tags: {
        name: `${stripId(data.url)}`,
      },
      headers: Object.assign(
        {
          authorization: data.token,
          [COMMON_CONFIG.HEADER_KEY.VER]: COMMON_CONFIG.LATEST_VER,
        },
        data.headers
      ) as any,
    });

  return sendHttpRequest(request, data);
}

// eslint-disable-next-line @typescript-eslint/ban-types
async function sendHttpRequest(request: Function, data: ApiData): Promise<any> {
  data.token = (await kv.get(data.actorUsername)) ?? (await getToken(data.actorUsername));

  const res = request();

  if (res.error_code) {
    if (res.status === 401) {
      data.token = await getToken(data.actorUsername);

      return sendHttpRequest(request, data);
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

function stripId(input: string): string {
  // UUID v4 regex pattern
  const regex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

  // Replacing all UUID v4 with 'id'
  return input.replace(regex, 'id');
}
