const db = require('./db.js');

// let questionIdLimit;
// let questionId;

// const checkLocked = async (option) => {
//   const
// }

// const getQuestionId = async () => {
//   // if we've reached the limit or we haven't allocated IDs, allocate IDs
//   if (!questionId || questionId >= questionIdLimit) {
//     // check if locked
//     // lock the thing
//     // select the thing
//     // unlock the thing
//     // return the thing
//   }
// };

module.exports = {
  getQuestionsByProduct: function (productId) {
    const q = `
      select question_id, body as question_body, question_date, asker_name, helpful as question_helpfulness, reported
      from qa.questions_by_product
      where product_id = ?`;

    return db.execute(q, [productId], { prepare: true }).then((result) => result.rows);
  },

  getAnswersByQuestion: function (questionId) {
    const q = `
      select answer_date, answer_id, answerer_name, body, helpful, photos
      from qa.answers_by_question
      where question_id = ?`;

    return db.execute(q, [questionId], { prepare: true }).then((result) => result.rows);
  },

  getAnswersByQuestions: function (questionIds) {
    const q = `
      select question_id, answer_id as id, body, answer_date as date, answerer_name, helpful as helpfulness, photos
      from qa.answers_by_question
      where question_id in ?`;

    return db.execute(q, [questionIds], { prepare: true }).then((result) => result.rows);
  },

  postQuestion: function ({ productId, askerEmail, askerName, body }) {
    const q0 = `select next_id from qa.next_id where type='question_id';`;

    if (!productId || !askerEmail || !askerName || !body)
      return new Promise((resolve, reject) => reject('productId, askerEmail, askerName, and body are all required'));

    return db
      .execute(q0, null, { prepare: true })
      .then((result) => {
        db.execute(`update qa.next_id set next_id = next_id + 1 where type='question_id'`, null, { prepare: true });
        return result.first().next_id.low;
      })
      .then((questionId) => {
        const q1 = `
          insert into qa.questions_by_product (product_id, question_date, question_id, asker_email, asker_name, body, helpful, reported) 
          values (?, todate(now()), ?, ?, ?, ?, 0, 0);
        `;
        const q2 = `insert into qa.questions (question_id, question_date, product_id) values (?, todate(now()), ?);`;

        const queries = [
          { query: q1, params: [productId, questionId, askerEmail, askerName, body] },
          { query: q2, params: [questionId, productId] },
        ];

        return db.batch(queries, { prepare: true });
      });
  },

  postAnswer: function ({ questionId, answererEmail, answererName, body, photos }) {
    if (!questionId || !answererEmail || !answererName || !body)
      return new Promise((_, reject) => reject('questionId, answererEmail, answererName, and body are all required'));

    const getNextAnswerId = `select next_id from qa.next_id where type='answer_id';`;

    return db
      .execute(getNextAnswerId, null, { prepare: true })
      .then((result) => {
        db.execute(`update qa.next_id set next_id = next_id + 1 where type='answer_id'`, null, { prepare: true });
        return result.first().next_id.low;
      })
      .then((answerId) => {
        const updateAnswersByQuestion = `
          insert into qa.answers_by_question (question_id, answer_date, answer_id, answerer_email, answerer_name, body, helpful, reported, photos) 
          values (?, todate(now()), ?, ?, ?, ?, 0, 0, ?);
        `;
        const updateAnswers = `insert into qa.answers (answer_id, answer_date, question_id) values (?, todate(now()), ?);`;

        const queries = [
          { query: updateAnswersByQuestion, params: [questionId, answerId, answererEmail, answererName, body, photos] },
          { query: updateAnswers, params: [answerId, questionId] },
        ];

        return db.batch(queries, { prepare: true });
      });
  },

  markAnswerHelpful: function (answerId) {},

  reportAnswer: function (answerId) {},

  markQuestionHelpful: function (questionId) {},

  reportQuestion: function (questionId) {},
};
