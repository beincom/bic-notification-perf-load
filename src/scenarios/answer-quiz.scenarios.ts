/* eslint-disable @typescript-eslint/ban-ts-comment */
import { check, group, sleep } from 'k6';
import execution from 'k6/execution';

import { Counter } from 'k6/metrics'; // @ts-ignore
import httpagg from 'k6/x/httpagg';

import { Actor } from '../entities/actor';
import { generateRandomNumber } from '../utils/utils';

export const NON_QUIZZES_COUNT = 'non_quizzes_count';
const NonQuizzesCounter = new Counter(NON_QUIZZES_COUNT);

const invalidUserNumber = [];

export async function answerQuizScenario(): Promise<void> {
  const vuID = execution.vu.idInTest; // Get current virtual user's id
  const groupId = '96990a90-7ee4-457f-85e2-00d8206a77f8'; // This is the test group id for the quiz

  if (invalidUserNumber.includes(vuID)) {
    return;
  }

  await group('AnswerQuizSession', async () => {
    const actor = Actor.init(vuID);

    const contents = await demoGetContentsHasQuizInGetTimeline(actor, groupId);

    if (contents?.length) {
      const pickedContent = contents[generateRandomNumber(0, contents.length - 1)];

      const contentDetailResult = await actor.getContentDetail(
        pickedContent.id,
        pickedContent.type
      );

      const content = contentDetailResult?.data || pickedContent;

      const randomTakingQuizTimes = generateRandomNumber(1, 5);

      for (let i = 0; i < randomTakingQuizTimes; i++) {
        const quiz = content.quiz;
        const doingQuizParticipantId = content.quizDoing?.quizParticipantId;

        // Start taking the quiz
        const quizParticipantId = doingQuizParticipantId || (await demoStartQuiz(actor, quiz.id));

        if (quizParticipantId) {
          // Get the quiz result
          const quiz = await demoGetQuizResult(actor, quizParticipantId);

          if (quiz) {
            // Answer the quiz
            const userAnswers = await demoAnswerQuiz({ actor, quizParticipantId, quiz });

            // Finish the quiz
            await demoFinishQuiz({ actor, quizParticipantId, quiz, userAnswers });

            // Get the quiz result again
            await demoGetQuizResult(actor, quizParticipantId);
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
function checkTimeUp(startedAt: string, timeLimit: number): boolean {
  const timeDiff = new Date().getTime() - new Date(startedAt).getTime();
  const timeDiffInSeconds = timeDiff / 1000;
  return timeDiffInSeconds >= timeLimit - 5;
}

async function demoGetContentsHasQuizInGetTimeline(actor: Actor, groupId: string): Promise<any[]> {
  const timelineResult = await actor.getTimeline(groupId);
  const timelineStatus = check(timelineResult, {
    '[timelineResult] code was api.ok': (res) => res?.code == 'api.ok',
  });
  httpagg.checkRequest(timelineResult, timelineStatus, {
    fileName: 'dashboard/httpagg-timelineResult.json',
    aggregateLevel: 'onError',
  });

  const contents = timelineResult?.data?.list || [];
  const contentsHasQuiz = contents.filter((content) => content.quiz?.id);

  return contentsHasQuiz;
}

async function demoStartQuiz(actor: Actor, quizId: string): Promise<string> {
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

async function demoGetQuizResult(actor: Actor, quizParticipantId: string): Promise<any> {
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

async function demoAnswerQuiz(data: {
  actor: Actor;
  quizParticipantId: string;
  quiz: any;
}): Promise<{ questionId: string; answerId: string }[]> {
  const { actor, quizParticipantId } = data;
  const { questions, startedAt, timeLimit } = data.quiz;

  const userAnswers = [];

  const randomAnsweringTimes = generateRandomNumber(1, questions.length);

  for (let j = 0; j < randomAnsweringTimes; j++) {
    // Simulate user need 3 to 10 seconds to read and answer a question
    sleep(generateRandomNumber(3, 10));

    // If there are still time left, answer the question
    if (!checkTimeUp(startedAt, timeLimit)) {
      const question = questions[j];
      const questionAnswers = question.answers;

      const pickedAnswer = questionAnswers[generateRandomNumber(0, questionAnswers.length - 1)];

      userAnswers.push({ questionId: question.id, answerId: pickedAnswer.id });

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

async function demoFinishQuiz(data: {
  actor: Actor;
  quizParticipantId: string;
  quiz: any;
  userAnswers: { questionId: string; answerId: string }[];
}): Promise<any> {
  const { actor, quizParticipantId, userAnswers } = data;
  const { startedAt, timeLimit } = data.quiz;

  // Randomly decide whether to submit the quiz or wait for time up
  const needActionToSubmit = generateRandomNumber(0, 3);

  if (needActionToSubmit !== 0) {
    // Simulate user need 3 to 10 seconds to check and submit the quiz
    sleep(generateRandomNumber(3, 10));

    // If there are still time left, submit the quiz
    if (!checkTimeUp(startedAt, timeLimit)) {
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
    if (!checkTimeUp(startedAt, timeLimit)) {
      const remainingTime =
        timeLimit - (new Date().getTime() - new Date(startedAt).getTime()) / 1000;
      sleep(remainingTime);
    }
  }
}
