import { ORDER } from '@beincom/constants';

export type User = {
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

export type QueryParams = {
  key?: string;
  offset?: number;
  limit?: number;
  sort?: Array<[any, ORDER]>;
  cursor?: string;
};
