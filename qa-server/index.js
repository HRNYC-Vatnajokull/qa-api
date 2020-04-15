const express = require('express');
const bodyParser = require('body-parser').json;

const Model = require('./model.js');
const { paginate } = require('./utils.js');

const app = express();
app.use(bodyParser());

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

app.post('/qa/:productId', (req, res) => {
  const productId = req.params.productId;
  const { body, name, email } = req.body;

  if (!productId || !body || !name || !email) {
    res.status(400).send('productId, body, name, and email are all required');
    return;
  }

  Model.postQuestion({ productId, askerEmail: email, askerName: name, body })
    .then(res.sendStatus(201))
    .catch((err) => res.sendStatus(500));
});

app.post('/qa/:questionId/answers', (req, res) => {
  const questionId = req.params.questionId;
  const { body, name, email, photos } = req.body;

  if (!questionId || !body || !name || !email) {
    res.status(400).send('questionId, body, name, and email are all required');
    return;
  }

  Model.postAnswer({ questionId, answererEmail: email, answererName: name, body, photos })
    .then(res.sendStatus(201))
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

app.listen(3000);
