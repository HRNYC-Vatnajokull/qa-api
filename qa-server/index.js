const express = require('express');

const Model = require('./model.js');
const { paginate } = require('./utils.js');

const app = express();

// TODO: consider refactoring to a stream and using parallel execution
app.get('/qa/:productId', async (req, res) => {
  let productId = req.params.productId;

  let questions = await Model.getQuestionsByProduct(productId);

  questions = paginate(
    questions.sort((a, b) => b.question_helpfulness - a.question_helpfulness),
    +req.query.page,
    +req.query.count
  );

  const answers = await Model.getAnswersByQuestions(questions.map((question) => question.question_id));

  for (const question of questions) {
    question.question_date = question.question_date.date;
    question.answers = {};

    for (answer of answers) {
      if (answer.question_id === question.question_id) {
        let { id, body, date, answerer_name, helpfulness, photos } = answer;
        question.answers[id] = {
          id,
          body,
          date: date.date,
          answerer_name,
          helpfulness,
          photos,
        };
      }
    }
  }

  res.send({
    product_id: productId,
    results: questions,
  });
});

app.get('/qa/:questionId/answers', (req, res) => {
  let questionId = req.params.questionId;

  Model.getAnswersByQuestion(questionId).then((rows) => {
    // TODO: keep sorted in the database
    rows.sort((row1, row2) => row2.helpful - row1.helpful);

    rows = paginate(rows, req.query.page, req.query.count);

    res.send({
      question: questionId,
      page: Number(req.query.page || paginate.DEFAULT_PAGE),
      count: Number(req.query.count || paginate.DEFAULT_COUNT),
      results: rows.map((row) => ({
        answer_id: row.answer_id,
        body: row.body,
        date: row.answer_date.date,
        answerer_name: row.answerer_name,
        helpfulness: row.helpful,
        photos: row.photos ? row.photos.map((url, ind) => ({ id: `${row.answer_id}.${ind}`, url })) : [],
      })),
    });
  });
});

app.listen(3000);
