// import { createData } from './create-data/create-data';
// import { convertQuizDumpToArray } from './create-quiz/convert-dump-to-array';

import { QuizService } from './services/quiz';

(async (): Promise<void> => {
  // await createData({
  //   communityIndex: 100,
  // }).catch(console.error);
  // await convertQuizDumpToArray().catch(console.error);
  await QuizService.createQuizCSV().catch(console.error);
})();
