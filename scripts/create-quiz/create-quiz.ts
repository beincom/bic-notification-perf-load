import { existsSync, readFileSync, writeFileSync } from 'fs';

import { User } from '../http/http-service';

import quiz_array from './quiz_array.json';

/**
  {
    communityId: 'c807e261-3322-459c-be69-0186f8023b60',
    groupId: '96990a90-7ee4-457f-85e2-00d8206a77f8',
    communityName: 'QC 1 Community 1',
    ownerId: 'f2ca9d2c-4097-49c4-9986-295685cbd0da',
    ownerUsername: 'betestsystemadmin',
  }
*/
export async function createQuizCsv(numOfQuiz: number = 20): Promise<void> {
  console.log({ step: 'START' });

  const quizzes = numOfQuiz > quiz_array.length ? quiz_array : quiz_array.slice(0, numOfQuiz);

  const communityAdmin = await User.init({ username: 'betestsystemadmin' });
  const groupId = '96990a90-7ee4-457f-85e2-00d8206a77f8';

  const contents = [];
  let contentAfter = '';

  while (contents.length < quizzes.length) {
    const timeline = await communityAdmin.getTimeline(groupId, contentAfter);
    contents.push(...timeline.list);
    contentAfter = timeline.meta.endCursor;
  }

  const fullQuizzes = quizzes.map((quiz, index) => ({
    ...quiz,
    post_id: contents[index].id,
    created_by: contents[index].createdBy,
    updated_by: contents[index].createdBy,
  }));

  const quizFields = [
    'id',
    'post_id',
    'title',
    'status',
    'description',
    'number_of_questions',
    'number_of_answers',
    'number_of_questions_display',
    'is_random',
    'meta',
    'gen_status',
    'created_by',
    'updated_by',
    'created_at',
    'updated_at',
    'error',
    'time_limit',
  ];
  const questionFields = ['id', 'quiz_id', 'content', 'created_at', 'updated_at'];
  const answerFields = ['id', 'question_id', 'is_correct', 'content', 'created_at', 'updated_at'];

  // Append to csv files
  appendToCsv('scripts/create-quiz/quiz.csv', fullQuizzes, quizFields);
  appendToCsv(
    'scripts/create-quiz/question.csv',
    quizzes.flatMap((quiz) => quiz.questions),
    questionFields
  );
  appendToCsv(
    'scripts/create-quiz/answer.csv',
    quizzes.flatMap((quiz) => quiz.questions.flatMap((question) => question.answers)),
    answerFields
  );

  return console.log({ step: 'FINISHED' });
}

function objectToCsvRow(obj: any, fields: string[]): string {
  return fields
    .map((field) => {
      const value = obj[field];
      if (field === 'meta' || field === 'error') {
        return '{}';
      }
      if (value === undefined || value === null) {
        return '';
      }
      return JSON.stringify(value);
    })
    .join(',');
}

function appendToCsv(filename: string, data: any[], fields: string[]): void {
  let csvString = '';

  // If file exists, read its content and append data
  if (existsSync(filename)) {
    const existingData = readFileSync(filename, 'utf8');
    csvString = existingData + '\n';
  } else {
    csvString = fields.join(',') + '\n';
  }

  // Append new data
  for (const obj of data) {
    csvString += objectToCsvRow(obj, fields) + '\n';
  }

  try {
    writeFileSync(filename, csvString);
    console.log(`${filename} updated successfully.`);
  } catch (err) {
    console.error(`Error updating ${filename}:`, err);
  }
}
