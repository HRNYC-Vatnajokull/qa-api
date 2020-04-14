const cassandra = require('cassandra-driver');
const { Transform } = require('stream');

const client = new cassandra.Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
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

  const paramStream = client.stream(qGetAnsPhoto, null, { prepare: true }).pipe(makeCounter(1e4)).pipe(addAnswerFields);

  cassandra.concurrent.executeConcurrent(client, qUpdateAnsByQ, paramStream, { prepare: true });
};

mainStream();
