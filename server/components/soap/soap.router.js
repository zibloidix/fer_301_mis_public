const express = require('express');
const router = express.Router();
const soapComponent = require('./soap.component.js');

router.post('/', (req, res, next) => {
  soapComponent(req, res, next);
});

module.exports = router;
