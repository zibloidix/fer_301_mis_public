const jsonDataBase = require('../../db.json');

module.exports = function(req, res, next) {
  req.jsonDataBase = jsonDataBase;
  next();  
}