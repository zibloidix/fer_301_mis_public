module.exports = (req, res, next) => {
  req.config = {};
  next();
}
