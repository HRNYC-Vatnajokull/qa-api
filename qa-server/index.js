const express = require('express');

const Model = require('./model.js');
const { paginate } = require('./utils.js');

const app = express();

app.get('/qa/:productId', (req, res) => {
  const {
    params: { productId },
    query: { page, count },
  } = req;

  res.send(productId);
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
