import { existsSync, readFileSync, writeFileSync } from 'fs';

import { UserService } from '../user';

import dumps from './dumps/quiz_array.json';

export class QuizService {
  /**
    {
      communityId: 'c807e261-3322-459c-be69-0186f8023b60',
      groupId: '96990a90-7ee4-457f-85e2-00d8206a77f8',
      communityName: 'QC 1 Community 1',
      ownerId: 'f2ca9d2c-4097-49c4-9986-295685cbd0da',
      ownerUsername: 'betestsystemadmin',
    }
  */
  public static async createQuizCSV(numOfQuiz: number = 20): Promise<void> {
    console.log({ step: 'START' });

    const quizzes = numOfQuiz > dumps.length ? dumps : dumps.slice(0, numOfQuiz);

    const communityAdmin = await UserService.init({ username: 'betestsystemadmin' });
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
    QuizService.appendToCSV('scripts/services/quiz/csv/quiz.csv', fullQuizzes, quizFields);
    QuizService.appendToCSV(
      'scripts/services/quiz/csv/question.csv',
      quizzes.flatMap((quiz) => quiz.questions),
      questionFields
    );
    QuizService.appendToCSV(
      'scripts/services/quiz/csv/answer.csv',
      quizzes.flatMap((quiz) => quiz.questions.flatMap((question) => question.answers)),
      answerFields
    );

    return console.log({ step: 'FINISHED' });
  }

  public static convertObject2CSVRow(obj: Record<string, any>, fields: string[]): string {
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

  public static appendToCSV(filename: string, data: any[], fields: string[]): void {
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
      csvString += QuizService.convertObject2CSVRow(obj, fields) + '\n';
    }

    try {
      writeFileSync(filename, csvString);
      console.log(`${filename} updated successfully.`);
    } catch (err) {
      console.error(`Error updating ${filename}:`, err);
    }
  }
}
