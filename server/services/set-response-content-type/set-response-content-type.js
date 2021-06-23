module.exports = function(req, res, next) {
    res.set('Content-Type', 'text/xml');
    next();
}