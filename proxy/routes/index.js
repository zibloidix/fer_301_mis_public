const rp = require('request-promise-native');
const express = require('express');
const router = express.Router();
const xml2js = require('xml2js');
const { parseString } = require('xml2js');

router.post('/', function (req, res, next) {
  const soapAction = getSoapAction(req.body);
  const jsonEnvelope = createJsonEnvelope(req.body);
  const builder = new xml2js.Builder({ xmldec: { version: '1.0', encoding: 'UTF-8' }});
  const xmlEnvelope = builder.buildObject(jsonEnvelope);
  const requestOptions = getReauestOptions(soapAction, xmlEnvelope)

  rp(requestOptions)
    .then((response) => {
      const parseConfig = {
        ignoreAttrs: true, 
        explicitArray: false, 
        trim: true
      };

      parseString(response, parseConfig, (err, result) => {
        const envelopeBody = getEnvelopeBody(result)
        res.send(envelopeBody);
      });
    })
    .catch(function (err) {
      res.send(err);
    });

});

function getReauestOptions(soapAction, xmlEnvelope) {
  const { SERVER_HOST, SERVER_PORT } = process.env;
  return {
    method: 'POST',
    uri: `http://${SERVER_HOST}:${SERVER_PORT}/er-portal`,
    body: xmlEnvelope,
    headers: {
      'Content-Type': 'text/xml',
      'SOAPAction': soapAction
    }
  };
}

function createJsonEnvelope(body) {
  const soapBody = Object.assign({}, body);
  soapBody.$ = { 'xmlns': 'http://www.rt-eu.ru/med/er/v2_0'};
  const jsonEnvelope = { 
    'soap:Envelope': { 
      $: {
        'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/'
      }, 
      'soap:Header': {}, 
      'soap:Body': soapBody
    }
  };
  return jsonEnvelope;
}

function getSoapAction(body) {
  if (Object.keys(body).length > 0) {
    const action = Object.keys(body)[0];
    return action.replace('Request','')
  }
  return '';
}

function isEnvelopeBodyExist(result) {
  if (typeof result['soap:Envelope'] !== 'undefined') {
    if (typeof result['soap:Envelope']['soap:Body'] !== 'undefined') {
      return true;
    }
  }
  return false;
}

function getEnvelopeBody(result) {
  if (isEnvelopeBodyExist(result)) {
    return result['soap:Envelope']['soap:Body'];
  } 
  return {};
}

module.exports = router;
