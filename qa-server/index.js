const express = require('express');

const Model = require('./model.js');

const app = express();

app.get('/qa/:productId', (req, res) => {
  const {
    params: { productId },
    query: { page, count },
  } = req;
  console.log(productId, page, count);
  res.send(productId);
});

app.listen(3000);
