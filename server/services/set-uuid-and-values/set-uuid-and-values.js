const utils = require('../../utils');

module.exports = (req, res, next) => {
  req.renderData = {};
  req.renderData.UUID_SESSION_ID = utils.getEnvelopeBodyElementValue(req, 'session_id');
  next();
}
