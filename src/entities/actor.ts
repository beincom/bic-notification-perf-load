import { GET, POST, PUT } from '../utils/http.utils';
import { COMMON_CONFIG, SERVICE } from '../common';
import { CONFIGS } from '../../config';

import { generateUserNameSeed } from '../../scripts/seed/user-seed-generator';
import { rand } from '../utils/utils';

export class Actor {
  public username: string;

  private constructor(data: { username: string }) {
    this.username = data.username;
  }

  public static init(index: number): Actor {
    const randomUserIndex = index || rand(CONFIGS.NUMBER_OF_USERS);
    const username = generateUserNameSeed(randomUserIndex);
    const actor = new Actor({ username });
    return actor;
  }

  public async getJoinedCommunities(): Promise<{
    data: { id: string; group_id: string; name: string }[];
  }> {
    return GET({
      actorUsername: this.username,
      url: `${SERVICE.GROUP.HOST}/me/communities?limit=500`,
    });
  }

  public async getNewsfeed(after?: string): Promise<any> {
    let url = `${SERVICE.CONTENT.HOST}/newsfeed?limit=20`;
    if (after) {
      url += `&after=${after}`;
    }
    return GET({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async getContentDetail(contentId: string, contentType: string): Promise<any> {
    switch (contentType) {
      case 'POST': {
        return GET({
          actorUsername: this.username,
          url: `${SERVICE.CONTENT.HOST}/posts/${contentId}`,
          headers: {
            [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER,
          },
        });
      }

      case 'ARTICLE': {
        return GET({
          actorUsername: this.username,
          url: `${SERVICE.CONTENT.HOST}/articles/${contentId}`,
          headers: {
            [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER,
          },
        });
      }

      case 'SERIES': {
        return GET({
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
    return GET({
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
    return GET({
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
    return GET({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async reaction(targetId: string, targetType: string, reactionName: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/reactions`;

    return POST({
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

    return PUT({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async saveContent(contentId: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/contents/${contentId}/save`;

    return POST({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async replyComment(contentId: string, commentId: string, content: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/comments/${commentId}/reply`;

    return POST({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
      body: { content, post_id: contentId },
    });
  }

  public async comment(contentId: string, content: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/comments`;

    return POST({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
      body: { content, post_id: contentId },
    });
  }

  public async startQuiz(quizId: string): Promise<any> {
    const url = `${SERVICE.CONTENT.HOST}/quiz-participant/${quizId}/start`;

    return POST({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
    });
  }

  public async getQuizResult(quizParticipantId: string): Promise<any> {
    return GET({
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

    return PUT({
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

    return PUT({
      actorUsername: this.username,
      url,
      headers: { [COMMON_CONFIG.HEADER_KEY.VER]: SERVICE.CONTENT.LATEST_VER },
      body: { answers, isFinished: true },
    });
  }
}
