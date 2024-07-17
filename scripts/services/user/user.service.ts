import { HttpService } from '@http/http.service';
import { IHttpServiceOptions } from '@http/interfaces';

import { CONFIGS } from '@config';

export class UserService extends HttpService {
  public username: string;
  public constructor(options: IHttpServiceOptions) {
    super(options);
    this.username = options.username;
  }

  public static async init(options: Omit<IHttpServiceOptions, 'token'>): Promise<UserService> {
    const token = await HttpService.getToken(
      options.username,
      options.password ?? CONFIGS.DEFAULT_PASSWORD,
      {
        clientId: CONFIGS.COGNITO_CLIENT_ID,
        userPool: CONFIGS.COGNITO_USER_POOL,
      }
    );

    options.endpoint = options.endpoint ?? CONFIGS.API_ENDPOINT;
    return new UserService({ ...options, token });
  }

  public async joinGroup(groupId: string): Promise<void> {
    return this.handleRequest(async () =>
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
      return this.handleRequest(async () =>
        this.http.put(`group/groups/${groupId}/join-requests/approve`, {})
      );
    } catch (e) {
      console.error('approveAllJoinRequests', e.response.data);
      throw new Error(`Cannot approve all join requests in group id: ${groupId}`);
    }
  }

  public async declineAllJoinRequests(groupId: string): Promise<void> {
    try {
      return this.handleRequest(async () =>
        this.http.put(`group/groups/${groupId}/join-requests/decline`, {})
      );
    } catch (e) {
      console.error('declineAllJoinRequests', e.response.data);
      throw new Error(`Cannot decline all join requests in group id: ${groupId}`);
    }
  }

  public async createDraftPost(groupIds: string[]): Promise<{ id: string }> {
    try {
      const res = await this.handleRequest(async () =>
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
      return this.handleRequest(async () =>
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
      const response = await this.handleRequest(async () =>
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
