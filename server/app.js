const path = require('path');
const xml2js = require('xml2js');
const logger = require('morgan');
const express = require('express');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const xmlparser = require('express-xml-bodyparser');

const setSoapActionService = require('./services/set-soap-action');
const setJsonDatabaseService = require('./services/set-json-database');
const setUUIDAndValuesService = require('./services/set-uuid-and-values');
const setConfigObjectService = require('./services/set-config-object');
const setYamlConfigService = require('./services/set-yaml-config');
const removeServiceSymbolsService = require('./services/remove-service-symbols');
const setResponseContentTypeService = require('./services/set-response-content-type');

const getJsonDatabaseRouter = require('./components/get-json-database');
const getBusySlotsRouter = require('./components/get-busy-slots');
const yamlConfigRouter = require('./components/yaml-config/yaml-config.router.js');
const wsdlRouter = require('./components/wsdl/wsdl.router.js');
const soapRouter = require('./components/soap/soap.router.js');

const app = express();

app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const stripPrefix = xml2js.processors.stripPrefix;
app.use(xmlparser({
  trim: false, 
  explicitArray: false,
  ignoreAttrs: true,
  tagNameProcessors: [ stripPrefix ],
  attrNameProcessors: [ stripPrefix ],
}));

app.use(setSoapActionService);
app.use(setUUIDAndValuesService);
app.use(setJsonDatabaseService);
app.use(setConfigObjectService);
app.use(setYamlConfigService);
app.use(setResponseContentTypeService);
app.use('/er-portal', wsdlRouter);
app.use('/er-portal', soapRouter);
app.use('/yaml-config', yamlConfigRouter);
app.use('/get-busy-slots', getBusySlotsRouter);
app.use('/get-json-database',  getJsonDatabaseRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err);
  res.status(err.status || 500).end();
});

process.on('SIGINT', exit);
process.on('SIGTERM', exit);

function exit() {
  process.exit();
}

module.exports = app;
