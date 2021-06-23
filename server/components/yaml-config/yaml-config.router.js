const yamlConfigComponent = require('./yaml-config.component.js');
const express = require('express');
const router = express.Router();

router.get('/:type', (req, res, next) => {
  yamlConfigComponent.get(req, res, next);
});

router.put('/user', (req, res, next) => {
  yamlConfigComponent.put(req, res, next);
});

module.exports = router;