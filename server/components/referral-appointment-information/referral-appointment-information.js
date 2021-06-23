const hb = require('express-handlebars').create();
const path = require('path');
const utils = require('../../utils');

class ReferralAppointmentInformation {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.renderData = null;
    this.hospitals = [];
    this.responsePath = this.getResponsePath();
    this.responseFile = 'ERROR_INTERNAL_ERROR.xml';
    this.activeErrorRule = this.getActiveErrorRule();
    if(this.isActiveErrorRule()) {
      this.responseFile = this.getResponseErrorFile();
    } else {
      this.initComponent();
    }
  }

  initComponent(){
    this.bookIdMis = this.getBookIdMis();
    this.referralId = this.getReferralId();
    this.referral = this.getReferral();
    if (this.isReferralFinded()) {
      this.responseFile = this.getResponseFile();
    } else {
      this.responseFile = 'ERROR_FAILURE_OPERATION.xml';
    }
    this.renderData = this.getRenderData();
  }

  getBookIdMis() {
    return this.req.body.envelope.body[this.req.soapAction].book_id_mis;
  }

  getReferralId() {
    return this.req.body.envelope.body[this.req.soapAction].referral_id;
  }

  getReferral() {
    return this.req.jsonDataBase.referrals.find( referral => referral._id === this.referralId);
  }

  isReferralFinded() {
    return typeof this.referral === 'undefined' ? false : true;
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
    return `referral-appointment-information-response.xml`;
  }

  getRenderData() {
    const renderData = {
      ...this.req.renderData,
      book_id_mis: this.bookIdMis
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
  const referralAppointmentInformation = new ReferralAppointmentInformation(req, res);
  referralAppointmentInformation.sendResponse();
}