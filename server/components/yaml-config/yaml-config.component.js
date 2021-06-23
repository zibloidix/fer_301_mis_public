const getRawBody = require('raw-body');
const path = require('path');
const fs = require('fs');

module.exports = {
  get,
  put,
}

function get(req, res, next){
  const { type } = req.params;
  const fileName = `${type}.conf.yml`;
  const fileContent = getFileContent(fileName);
  res.set('Content-Type', 'application/xml');
  res.send(fileContent);
}

function put(req, res, next) {
  const fileName = 'user.conf.yml';
  const fileContent = getRawBody(req)
    .then( 
      (rawBody) => { 
        putFileContent(fileName, rawBody);
        res.send('');
      }
    );
}

function getFileContent(fileName) {
  const yamlConfigFilePath = path.join(__dirname, '..', '..', fileName);
  return fs.readFileSync(yamlConfigFilePath, 'utf8');
}

function putFileContent(fileName, fileContent) {
  const yamlConfigFilePath = path.join(__dirname, '..', '..', fileName);
  fs.writeFileSync(yamlConfigFilePath, fileContent, 'utf8');
}
