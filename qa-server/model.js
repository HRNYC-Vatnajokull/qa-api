const db = require('./db.js');

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

  postQuestion: function () {},

  postAnswer: function () {},

  markAnswerHelpful: function (answerId) {},

  reportAnswer: function (answerId) {},

  markQuestionHelpful: function (questionId) {},

  reportQuestion: function (questionId) {},
};
