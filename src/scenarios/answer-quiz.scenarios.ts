/* eslint-disable @typescript-eslint/ban-ts-comment */
import { check, group, sleep } from 'k6';
import execution from 'k6/execution';

import { Counter } from 'k6/metrics'; // @ts-ignore
import httpagg from 'k6/x/httpagg';

import { ActorEntity } from '@dals/entities';
import { StringHelper } from '@shared/helpers';

export const NON_QUIZZES_COUNT = 'non_quizzes_count';

const NonQuizzesCounter = new Counter(NON_QUIZZES_COUNT);
const invalidUserIds = [];

export async function answerQuizScenario(): Promise<void> {
  const virtualUserId = execution.vu.idInTest; // Get current virtual user's id
  const groupId = '96990a90-7ee4-457f-85e2-00d8206a77f8'; // This is the test group id for the quiz
  if (invalidUserIds.includes(virtualUserId)) {
    return;
  }

  await group('AnswerQuizSession', async () => {
    const actor = ActorEntity.init(virtualUserId);
    const contents = await getContentsHasQuizInGetTimeline(actor, groupId);

    if (contents?.length) {
      let content = contents[StringHelper.getRandomNumber(0, contents.length - 1)];

      const contentDetailResult = await actor.getContentDetails(content.id, content.type);
      content = contentDetailResult?.data || content;

      const quizLength = StringHelper.getRandomNumber(1, 5);
      for (let i = 0; i < quizLength; i++) {
        const quiz = content.quiz;
        const doingQuizParticipantId = content.quizDoing?.quizParticipantId;

        // Start taking the quiz
        const quizParticipantId = doingQuizParticipantId || (await startQuiz(actor, quiz.id));
        if (quizParticipantId) {
          // Get the quiz result
          const quiz = await getQuizResult(actor, quizParticipantId);
          if (quiz) {
            // Answer the quiz
            const userAnswers = await answerQuiz({ actor, quizParticipantId, quiz });

            // Finish the quiz
            await finishQuiz({ actor, quizParticipantId, quiz, userAnswers });

            // Get the quiz result again
            await getQuizResult(actor, quizParticipantId);
          }
        }

        // Simulate user need 3 seconds to rest before taking another quiz
        sleep(3);
      }
    } else {
      NonQuizzesCounter.add(1);
    }
  });
}

// timeLimit is seconds
function isTimeUp(startedAt: string, timeLimit: number): boolean {
  const timeDiff = new Date().getTime() - new Date(startedAt).getTime();
  const timeDiffInSeconds = timeDiff / 1000;
  return timeDiffInSeconds >= timeLimit - 5;
}

async function getContentsHasQuizInGetTimeline(
  actor: ActorEntity,
  groupId: string
): Promise<any[]> {
  const timelineResult = await actor.getTimeline(groupId);
  const timelineStatus = check(timelineResult, {
    '[getTimelineResult] code was api.ok': (res) => res?.code == 'api.ok',
  });

  httpagg.checkRequest(timelineResult, timelineStatus, {
    fileName: 'dashboard/httpagg-timelineResult.json',
    aggregateLevel: 'onError',
  });

  const contents = timelineResult?.data?.list || [];
  return contents.filter((content) => content.quiz?.id);
}

async function startQuiz(actor: ActorEntity, quizId: string): Promise<string> {
  const startQuizResult = await actor.startQuiz(quizId);
  const startQuizStatus = check(startQuizResult, {
    '[startQuizResult] code was api.ok': (res) => res?.code == 'api.ok',
  });

  httpagg.checkRequest(startQuizResult, startQuizStatus, {
    fileName: 'dashboard/httpagg-startQuizResult.json',
    aggregateLevel: 'onError',
  });

  return startQuizResult?.data;
}

async function getQuizResult(actor: ActorEntity, quizParticipantId: string): Promise<any> {
  const getQuizResult = await actor.getQuizResult(quizParticipantId);
  const getQuizStatus = check(getQuizResult, {
    '[getQuizResult] code was api.ok': (res) => res?.code == 'api.ok',
  });

  httpagg.checkRequest(getQuizResult, getQuizStatus, {
    fileName: 'dashboard/httpagg-getQuizResult.json',
    aggregateLevel: 'onError',
  });

  return getQuizResult?.data;
}

async function answerQuiz(data: {
  actor: ActorEntity;
  quizParticipantId: string;
  quiz: any;
}): Promise<{ questionId: string; answerId: string }[]> {
  const { actor, quizParticipantId } = data;
  const { questions, startedAt, timeLimit } = data.quiz;

  const userAnswers = [];
  const answerLength = StringHelper.getRandomNumber(1, questions.length);

  for (let j = 0; j < answerLength; j++) {
    // Simulate user need 3 to 10 seconds to read and answer a question
    sleep(StringHelper.getRandomNumber(3, 10));

    // If there are still time left, answer the question
    if (!isTimeUp(startedAt, timeLimit)) {
      const question = questions[j];
      const questionAnswers = question.answers;

      const awnser = questionAnswers[StringHelper.getRandomNumber(0, questionAnswers.length - 1)];
      userAnswers.push({ questionId: question.id, answerId: awnser.id });

      const answerQuizResult = await actor.answerQuiz(quizParticipantId, userAnswers);
      const answerQuizStatus = check(answerQuizResult, {
        '[answerQuizResult] code was api.ok': (res) => res?.code == 'api.ok',
      });

      httpagg.checkRequest(answerQuizResult, answerQuizStatus, {
        fileName: 'dashboard/httpagg-answerQuizResult.json',
        aggregateLevel: 'onError',
      });
    }
  }

  return userAnswers;
}

async function finishQuiz(data: {
  actor: ActorEntity;
  quizParticipantId: string;
  quiz: any;
  userAnswers: { questionId: string; answerId: string }[];
}): Promise<any> {
  const { actor, quizParticipantId, userAnswers } = data;
  const { startedAt, timeLimit } = data.quiz;

  // Randomly decide whether to submit the quiz or wait for time up
  const needActionToSubmit = StringHelper.getRandomNumber(0, 3);
  if (needActionToSubmit !== 0) {
    // Simulate user need 3 to 10 seconds to check and submit the quiz
    sleep(StringHelper.getRandomNumber(3, 10));

    // If there are still time left, submit the quiz
    if (!isTimeUp(startedAt, timeLimit)) {
      const finishQuizResult = await actor.finishQuiz(quizParticipantId, userAnswers);
      const finishQuizStatus = check(finishQuizResult, {
        '[finishQuizResult] code was api.ok': (res) => res?.code == 'api.ok',
      });

      httpagg.checkRequest(finishQuizResult, finishQuizStatus, {
        fileName: 'dashboard/httpagg-finishQuizResult.json',
        aggregateLevel: 'onError',
      });
    }
  } else {
    // Wait for time up
    if (!isTimeUp(startedAt, timeLimit)) {
      const remainingTime =
        timeLimit - (new Date().getTime() - new Date(startedAt).getTime()) / 1000;
      sleep(remainingTime);
    }
  }
}
