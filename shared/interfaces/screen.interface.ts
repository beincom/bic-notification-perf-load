import { ActorEntity } from '@dals/entities';
import { API_KEYS } from '@shared/constants';

export interface IScreenInput {
  actor: ActorEntity;
  contentId?: string;
  contentType?: string;
}

export type IScreenOutput = {
  [key in API_KEYS]?: Promise<any>;
};
