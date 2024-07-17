import { Community } from '@http/types';
import { HttpService } from '@http/http.service';
import { IHttpServiceOptions } from '@http/interfaces';

import { CONFIGS } from '@config';

import { UserService } from './user.service';

export class SysAdminService extends UserService {
  public constructor(options: IHttpServiceOptions) {
    super(options);
  }

  public static async init(): Promise<SysAdminService> {
    const token = await HttpService.getToken(CONFIGS.SYS_ADMIN_USER_NAME, CONFIGS.DEFAULT_PASSWORD);
    return new SysAdminService({
      username: CONFIGS.SYS_ADMIN_USER_NAME,
      password: CONFIGS.DEFAULT_PASSWORD,
      endpoint: CONFIGS.API_ENDPOINT,
      token,
    });
  }

  public async getCommunityByName(name: string): Promise<Community> {
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

  public async getCommunityMembers(
    communityId: string,
    limit: number = 10
  ): Promise<UserService[]> {
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

  public async getUserById(userId: string): Promise<UserService> {
    try {
      const res = await this.http.get(`/user/admin/users/${userId}/profile`);
      return res.data.data;
    } catch (e) {
      console.error('findUserById', e.response.data);
      throw new Error(`Cannot get the user profile with user id: ${userId}`);
    }
  }
}
