const db = require('./db.js');

module.exports = {
  getQuestionsByProduct: function (productId) {},

  getAnswersByQuestion: function (questionId) {
    const q = `select answer_date, answer_id, answerer_name, body, helpful, photos
       from qa.answers_by_question
       where question_id = ?`;

    return db.execute(q, [questionId], { prepare: true }).then((result) => result.rows);
  },

  postQuestion: function () {},

  postAnswer: function () {},

  markAnswerHelpful: function (answerId) {},

  reportAnswer: function (answerId) {},

  markQuestionHelpful: function (questionId) {},

  reportQuestion: function (questionId) {},
};
