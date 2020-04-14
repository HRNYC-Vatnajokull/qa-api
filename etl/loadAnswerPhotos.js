const cassandra = require('cassandra-driver');
const { Transform } = require('stream');

const client = new cassandra.Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
  // keyspace: 'qa',
});

client.connect();

const stringify = new Transform({
  writableObjectMode: true,
  transform: function (chunk, encoding, next) {
    if (chunk.answer_id) this.push(JSON.stringify(chunk, null, 2) + '\n');
    this.counter++;
    if (this.counter % 1e3 === 0) console.log(this.counter);
    next();
  },
});
stringify.counter = 0;

const makeCounter = (interval) => {
  const tx = new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform: function (chunk, encoding, next) {
      this.counter++;
      if (this.counter % interval === 0) {
        console.log(this.counter);
      }
      this.push(chunk);
      next();
    },
  });

  tx.counter = 0;
  return tx;
};

const main = async () => {
  // get answer IDs
  // for each answer ID
  // get answer photos for that answer id
  // get answer date, product id
  // then update answers_by_question with full set of photos

  const qGetAnsIDs = 'select distinct answer_id from stg.answer_photos';
  const qGetAnsPhoto = 'select * from stg.answer_photos';
  const qGetAns = 'select * from qa.answers where answer_id = :ans_id';
  const qUpdateAnsByQ =
    'update qa.answers_by_question set photos = photos + :photos where question_id=:q_id and answer_date=:ans_date and answer_id=:ans_id';

  const ansPhotos = await client.execute(qGetAnsPhoto, null, { prepare: true });
  let i = 0;
  for await (const ansPhoto of ansPhotos) {
    if (i % 100000 === 0) console.log(i);
    i++;

    const ans = (await client.execute(qGetAns, { ans_id: ansPhoto.answer_id }, { prepare: true })).rows[0];
    if (ans) {
      console.log(i);

      client.execute(
        qUpdateAnsByQ,
        { photos: [ansPhoto.url], q_id: ans.question_id, ans_date: ans.answer_date, ans_id: ans.answer_id },
        { prepare: true }
      );
    }
  }
};

const mainStream = async () => {
  // stream answer IDs
  // transform answerID to questionID, answerDate, answerID

  const qGetAnsPhoto = 'select * from stg.answer_photos';
  const qGetAns = 'select * from qa.answers where answer_id = :ans_id';
  const qUpdateAnsByQ =
    'update qa.answers_by_question set photos = photos + ? where question_id=? and answer_date=? and answer_id=?';

  const addAnswerFields = new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform: function (ansPhoto, encoding, next) {
      client.execute(qGetAns, { ans_id: ansPhoto.answer_id }, { prepare: true }).then(({ rows }) => {
        const ans = rows[0];
        if (ans) {
          this.push([[ansPhoto.url], ans.question_id, ans.answer_date, ans.answer_id]);
        }
        next();
      });
    },
  });

  const updateAnswerPhotos = new Transform({
    writableObjectMode: true,
    transform: function (params, encoding, next) {
      client.execute(qUpdateAnsByQ, params, { prepare: true });
      next();
    },
  });

  // const ansPhotoStream = client
  //   .stream(qGetAnsPhoto, null, { prepare: true })
  //   .pipe(makeCounter(1e4))
  //   .pipe(addAnswerFields)
  //   .pipe(updateAnswerPhotos);
  const paramStream = client.stream(qGetAnsPhoto, null, { prepare: true }).pipe(makeCounter(1e4)).pipe(addAnswerFields);

  cassandra.concurrent.executeConcurrent(client, qUpdateAnsByQ, paramStream, { prepare: true });
};

// const other = async () => {
//   const qUpdateAnsByQ =
//     'update qa.answers_by_question set photos = photos + ? where question_id=? and answer_date=? and answer_id=?';
//   client.execute(qUpdateAnsByQ, [['testurl'], 1584, '2019-01-12', 5517], { prepare: true });
// };

mainStream();
// other();
