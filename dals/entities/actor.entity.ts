import { HttpHelper } from '@shared/helpers';
import { StringHelper } from '@shared/helpers/string.helper';
import { UserSeeding } from '@seed/user.seed';

import { CONFIGS } from '@config';
import { COMMON_CONFIG, SERVICE } from '@shared/common';

export class ActorEntity {
  public username: string;

  private constructor(data: { username: string }) {
    this.username = data.username;
  }

  public static init(index: number): ActorEntity {
    const userIndex = index || StringHelper.getRandomNumber(CONFIGS.NUMBER_OF_USERS);
    const username = UserSeeding.seedUsername(userIndex);
    const actor = new ActorEntity({ username });
    return actor;
  }

  public async getJoinedCommunities(): Promise<{
    data: { id: string; group_id: string; name: string }[];
  }> {
    return HttpHelper.GET({
      actorUsername: this.username,
      url: `${SERVICE.GROUP.HOST}/me/communities?limit=500`,
    });
  }

  public async getNewsfeed(after?: string): Promise<any> {
    let url = `${SERVICE.CONTENT.HOST}/newsfeed?limit=20`;
    if (after) {
      url += `&after=${after}`;
    }
    return HttpHelper.GET({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async getContentDetails(contentId: string, contentType: string): Promise<any> {
    switch (contentType) {
      case 'POST': {
        return HttpHelper.GET({
          actorUsername: this.username,
          url: `${SERVICE.CONTENT.HOST}/posts/${contentId}`,
          headers: {
            [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER,
          },
        });
      }

      case 'ARTICLE': {
        return HttpHelper.GET({
          actorUsername: this.username,
          url: `${SERVICE.CONTENT.HOST}/articles/${contentId}`,
          headers: {
            [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER,
          },
        });
      }

      case 'SERIES': {
        return HttpHelper.GET({
          actorUsername: this.username,
          url: `${SERVICE.CONTENT.HOST}/series/${contentId}`,
          headers: {
            [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER,
          },
        });
      }

      default: {
        return null;
      }
    }
  }

  public async getMenuSettings(contentId: string): Promise<any> {
    return HttpHelper.GET({
      actorUsername: this.username,
      url: `${SERVICE.CONTENT.HOST}/contents/${contentId}/menu-settings`,
      headers: {
        [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER,
      },
    });
  }

  public async getComments(contentId: string, after?: string): Promise<any> {
    let url = `${SERVICE.CONTENT.HOST}/comments?post_id=${contentId}&limit=20`;
    if (after) {
      url += `&after=${after}`;
    }
    return HttpHelper.GET({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async getTimeline(groupId: string, after?: string): Promise<any> {
    let url = `${SERVICE.CONTENT.HOST}/timeline/${groupId}?limit=20`;
    if (after) {
      url += `&after=${after}`;
    }

    return HttpHelper.GET({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async reaction(targetId: string, targetType: string, reactionName: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/reactions`;

    return HttpHelper.POST({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
      body: {
        target_id: targetId,
        target: targetType,
        reaction_name: reactionName,
      },
    });
  }

  public async markAsRead(contentId: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/contents/${contentId}/mark-as-read`;

    return HttpHelper.PUT({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async saveContent(contentId: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/contents/${contentId}/save`;

    return HttpHelper.POST({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async replyComment(contentId: string, commentId: string, content: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/comments/${commentId}/reply`;

    return HttpHelper.POST({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
      body: { content, post_id: contentId },
    });
  }

  public async comment(contentId: string, content: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/comments`;

    return HttpHelper.POST({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
      body: { content, post_id: contentId },
    });
  }

  public async startQuiz(quizId: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/quiz-participant/${quizId}/start`;

    return HttpHelper.POST({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async getQuizResult(quizParticipantId: string): Promise<any> {
    return HttpHelper.GET({
      actorUsername: this.username,
      url: `${SERVICE.CONTENT.HOST}/quiz-participant/${quizParticipantId}`,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async answerQuiz(
    quizParticipantId: string,
    answers: { questionId: string; answerId: string }[]
  ): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/quiz-participant/${quizParticipantId}/answers`;

    return HttpHelper.PUT({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
      body: { answers },
    });
  }

  public async finishQuiz(
    quizParticipantId: string,
    answers: { questionId: string; answerId: string }[]
  ): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/quiz-participant/${quizParticipantId}/answers`;

    return HttpHelper.PUT({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
      body: { answers, isFinished: true },
    });
  }
}
