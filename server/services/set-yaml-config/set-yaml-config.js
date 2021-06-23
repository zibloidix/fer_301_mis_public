const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res, next) => {
  const userYamlConfigFile = getYamlConfigFile('user.conf.yml');
  const defailtYamlConfigFile = getYamlConfigFile('default.conf.yml');
  const userConfig = yamlToJson(userYamlConfigFile);
  const defailtConfig = yamlToJson(defailtYamlConfigFile);
  if (isCanUseUserConfig(userConfig)) {
    setConfig(req, userConfig);
  } else {
    setConfig(req, defailtConfig);
  }
  next();
}

function getYamlConfigFile(fileName) {
  const filePath = path.join(__dirname, '..', '..', fileName);
  return  fs.readFileSync(filePath, 'utf8');
}

function isNotEmpty(fileContent) {
  return fileContent.length > 0;
} 

function yamlToJson(yamlFileContent) {
  if (isNotEmpty(yamlFileContent)) {
    return yaml.safeLoad(yamlFileContent);
  }
  return {};
}

function isCanUseUserConfig(userConfig) {
  if (typeof userConfig.useDefaultYamlConfig !== 'undefined') {
    return userConfig.useDefaultYamlConfig === true ? false : true;
  }
  return false;
}

function setConfig(req, conf) {
  const { operations } = conf;
  req.config['operations'] = [...operations];
}
