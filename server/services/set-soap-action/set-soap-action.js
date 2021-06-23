module.exports = (req, res, next) => {
  if (typeof req.body.envelope !== 'undefined'){
    const bodyKeys = Object.keys(req.body.envelope.body);
    if (bodyKeys.length === 1) {
      req.soapAction = bodyKeys[0];
    }
  }
  next();
}