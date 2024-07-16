import { API_KEYS } from '../constants/api-keys.const';
import { Actor } from '../entities/actor';

export interface IScreenInput {
  actor: Actor;
  contentId?: string;
  contentType?: string;
}

export type IScreenOutput = {
  [key in API_KEYS]?: Promise<any>;
};
