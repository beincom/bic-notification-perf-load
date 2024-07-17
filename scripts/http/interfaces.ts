export interface ICognitoToken {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface IHttpServiceOptions {
  endpoint?: string;
  token: ICognitoToken;
  username: string;
  password?: string;
}
