import { writeFileSync } from 'fs';

import quiz_dump from './quiz_dump.json';

export async function convertQuizDumpToArray(): Promise<void> {
  console.log({ step: 'START' });

  const quizzes = (quiz_dump as any[]).reduce((acc, quiz) => {
    const quizIndex = acc.findIndex((q) => q.id === quiz.quiz_id);
    if (quizIndex === -1) {
      acc.push({
        id: quiz.quiz_id,
        post_id: '',
        title: quiz.quiz_title,
        status: quiz.quiz_status,
        description: quiz.quiz_description,
        number_of_questions: quiz.quiz_number_of_questions,
        number_of_answers: quiz.quiz_number_of_answers,
        number_of_questions_display: quiz.quiz_number_of_questions_display,
        is_random: quiz.quiz_is_random,
        meta: quiz.quiz_meta,
        gen_status: quiz.quiz_gen_status,
        created_by: '',
        updated_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error: quiz.quiz_error,
        time_limit: quiz.quiz_time_limit,
        questions: [
          {
            id: quiz.question_id,
            quiz_id: quiz.quiz_id,
            content: quiz.question_content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            answers: [
              {
                id: quiz.answer_id,
                question_id: quiz.question_id,
                is_correct: quiz.answer_is_correct,
                content: quiz.answer_content,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        ],
      });
    } else {
      const questionIndex = acc[quizIndex].questions.findIndex((q) => q.id === quiz.question_id);
      if (questionIndex === -1) {
        acc[quizIndex].questions.push({
          id: quiz.question_id,
          quiz_id: quiz.quiz_id,
          content: quiz.question_content,
          answers: [
            {
              id: quiz.answer_id,
              question_id: quiz.question_id,
              is_correct: quiz.answer_is_correct,
              content: quiz.answer_content,
            },
          ],
        });
      } else {
        acc[quizIndex].questions[questionIndex].answers.push({
          id: quiz.answer_id,
          question_id: quiz.question_id,
          is_correct: quiz.answer_is_correct,
          content: quiz.answer_content,
        });
      }
    }
    return acc;
  }, []);

  writeFileSync('scripts/create-quiz/quiz_array.json', JSON.stringify(quizzes, null, 2));

  return console.log({ step: 'FINISHED' });
}
