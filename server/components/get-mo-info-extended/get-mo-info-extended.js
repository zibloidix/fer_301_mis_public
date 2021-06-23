const hb = require('express-handlebars').create();
const path = require('path');
const utils = require('../../utils');

class GetMOInfoExtended {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.renderData = null;
    this.hospitals = [];
    this.responsePath = this.getResponsePath();
    this.responseFile = 'ERROR_REFERRAL_NOT_FOUND.xml';
    this.activeErrorRule = this.getActiveErrorRule();
    if(this.isActiveErrorRule()) {
      this.responseFile = this.getResponseErrorFile();
    } else {
      this.initComponent();
    }
  }

  initComponent(){
    if (this.isSessionFinded()) {
      this.patient = this.getPatient();
      if (this.isPatientFinded()) {
        this.hospitals = this.getHospitals();
        this.responseFile = this.getResponseFile();
        this.renderData = this.getRenderData();
      } else {
        this.responseFile = 'ERROR_NO_DATA_FOUND.xml';
      }
    } else {
      this.responseFile = 'ERROR_SESSION_TIMED_OUT.xml';
    }
  }

  isSessionFinded() {
    const { UUID_SESSION_ID } = this.req.renderData;
    return this.req.jsonDataBase.patients.some( patient => patient.sessions.find( session => session._id === UUID_SESSION_ID));
  }

  getPatient() {
    const { UUID_SESSION_ID } = this.req.renderData;
    return this.req.jsonDataBase.patients.find( patient => patient.sessions.find( session => session._id === UUID_SESSION_ID));
  }

  isPatientFinded() {
    return typeof this.patient === 'undefined' ? false : true;
  }

  getHospitals() {
    const { hospital_id } = this.patient;
    return this.req.jsonDataBase.hospitals.filter(hospital => hospital._id === hospital_id);
  }

  getResponsePath() {
    return path.join(__dirname, 'responses');
  }

  getActiveErrorRule() {
    const operation = this.req.config.operations.find((operation) => {
      return operation.request.toLowerCase() === this.req.soapAction;
    });
    const rule = operation.rules.find((rule) => rule.isActive === true && rule.isError === true);
    return rule;
  }

  isActiveErrorRule() {
    return typeof this.activeErrorRule === 'undefined' ? false : true;
  }

  getResponseErrorFile() {
    const { base } = path.parse(this.activeErrorRule.path);
    return base;
  }

  getResponseFile() {
    return `get-mo-info-extended-response.xml`;
  }

  getRenderData() {
    const renderData = {
      ...this.req.renderData,
      hospitals: this.hospitals
    };

    return renderData;
  }

  sendResponse() {
    const renderData = this.renderData || this.req.renderData;
    const renderFile = `${this.responsePath}/${this.responseFile}`;

    hb.render(renderFile, renderData)
      .then((renderedString) => {
        this.res.send(renderedString);
      })
      .catch(err => {
        console.log(err)
        this.res.status(500).send(err);
      })
  }
}

module.exports = function (req, res, next) {
  const getMOInfoExtended = new GetMOInfoExtended(req, res);
  getMOInfoExtended.sendResponse();
}