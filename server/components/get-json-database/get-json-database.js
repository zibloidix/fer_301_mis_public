const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.set('Content-Type', 'text/json');
  res.send(req.jsonDataBase);
});

module.exports = router;