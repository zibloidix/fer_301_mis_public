const hb = require('express-handlebars').create();
const path = require('path');
const utils = require('../../utils');

class GetServicePostSpecsInfo {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.renderData = null;
    this.doctors = [];
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
      this.doctors = this.getDoctors();
      if (this.isDoctorsFinded()) {
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

  getDoctors() {
    const mo_id = this.req.body.envelope.body[this.req.soapAction].mo_id;
    return this.req.jsonDataBase.doctors.filter( doctor => doctor.hospital_id === mo_id);
  }

  isDoctorsFinded() {
    return this.doctors.length > 0;
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
    return `get-service-post-specs-info-response.xml`;
  }

  getRenderData() {
    const renderData = {
      ...this.req.renderData,
      doctors: this.doctors
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
  const getServicePostSpecsInfo = new GetServicePostSpecsInfo(req, res);
  getServicePostSpecsInfo.sendResponse();
}