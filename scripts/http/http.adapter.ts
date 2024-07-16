import axios, { AxiosRequestTransformer, AxiosResponseTransformer } from 'axios';
import merge from 'deepmerge';

interface IHttpAdapterOptions {
  baseURL?: string;
  headers?: Record<string, any>;
  params?: Record<string, any>;
  transformRequest?: AxiosRequestTransformer | AxiosRequestTransformer[];
  transformResponse?: AxiosResponseTransformer | AxiosResponseTransformer[];
}

export class HttpAdapter {
  private readonly options: IHttpAdapterOptions;

  public constructor(options: IHttpAdapterOptions = {}) {
    this.options = options;
  }

  public setHeader(obj: object): void {
    this.options.headers = { ...this.options.headers, ...obj };
  }

  public get(url: string, options: IHttpAdapterOptions = {}): Promise<any> {
    const httpOptions = merge(this.options, options);

    return axios.get(url, httpOptions);
  }

  public post(url: string, data: unknown, options: IHttpAdapterOptions = {}): Promise<any> {
    const httpOptions = merge(this.options, options);

    return axios.post(url, data, httpOptions);
  }

  public put(url: string, data: unknown, options: IHttpAdapterOptions = {}): Promise<any> {
    const httpOptions = merge(this.options, options);

    return axios.put(url, data, httpOptions);
  }

  public delete(url: string, options: IHttpAdapterOptions = {}): Promise<any> {
    const httpOptions = merge(this.options, options);

    return axios.delete(url, httpOptions);
  }
}
