// import { createData } from './create-data/create-data';
// import { convertQuizDumpToArray } from './create-quiz/convert-dump-to-array';
import { createQuizCsv } from './create-quiz/create-quiz';

(async () => {
  // await createData({
  //   communityIndex: 100,
  // }).catch(console.error);
  // await convertQuizDumpToArray().catch(console.error);
  await createQuizCsv().catch(console.error);
})();
