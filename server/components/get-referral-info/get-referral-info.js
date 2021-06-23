const hb  = require('express-handlebars').create();
const path = require('path');
const utils = require('../../utils');
// const removeServiceSymbols = require('../../services/remove-service-symbols');

function removeServiceSymbols(xml) {
  return xml 
    .replace(/\:*/gi,'')
    .replace(/_/gi,'')
    .replace(/\&/gi,'')
    .replace(/\@/gi,'')
    .replace(/\#/gi,'')
    .replace(/\+/gi,'')
    .replace(/\$/gi,'')
    .replace(/\^/gi,'')
    .replace(/\*/gi,'')
    .replace(/\\/gi,'')
    .replace(/\//gi,'')
    .replace(/\{/gi,'')
    .replace(/\}/gi,'')
    .replace(/\(/gi,'')
    .replace(/\)/gi,'')
    .replace(/\[/gi,'')
    .replace(/\]/gi,'')
    .replace(/\|/gi,'');
}

class GetReferralInfo {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.renderData = null;
    this.referral = [];
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
    this.patient = this.getPatient();
    this.originalRegerralNumber = this.getReferralNumber();
    this.referral = this.getReferralByNumber();
    if (this.isPatientFinded()) {
      if (this.isReferralFinded()) {
        this.chainSessionIdWithPatient();

        this.responseFile = this.getResponseFile();
        this.renderData = this.getRenderData();
      } else {
        this.responseFile = 'ERROR_REFERRAL_NOT_FOUND.xml';
      }
      
    } else {
      this.responseFile = 'ERROR_PATIENT_NOT_FOUND.xml';
    }
  }

  getPatient() {
    const patientFromRequest = utils.getEnvelopeBodyElementValue(this.req, 'patient_data');
    const patientFromJsonFile = this.req.jsonDataBase.patients.find( patient => patient.snils === patientFromRequest.snils);
    return patientFromJsonFile;
  }

  isPatientFinded() {
    return typeof this.patient === 'undefined' ? false : true;
  }

  getReferralByNumber() {
    const { _id } = this.patient;
    const referralNumber = removeServiceSymbols(`${this.getReferralNumber()}`);

    const referral = this.req.jsonDataBase.referrals
      .filter( referral => `${referral.number}`.toLowerCase() === `${referralNumber}`.toLowerCase()
                      && referral.patient_id === _id );
    
    const referralWithAttachedReources = this.attachResourcesToReferrals(referral);
    return referralWithAttachedReources;
  }

  getReferralNumber() {
    const referralNumber = this.req.body.envelope.body[this.req.soapAction].referral_number;
    return referralNumber;
  }

  isReferralFinded() {
    return this.referral.length === 1;
  }

  chainSessionIdWithPatient() {
    const { UUID_SESSION_ID } = this.req.renderData;
    if (!this.patient.sessions.find( session => session._id === UUID_SESSION_ID)) {
      this.patient.sessions.push({
        _id: UUID_SESSION_ID,
        date: new Date()
      })
    }
  }


  attachResourcesToReferrals(referralsFromJson) {
    const referrals = referralsFromJson.map( (referral) => {
      const fromResource = this.getDoctorById(referral.from_resource);
      const toResource = this.getDoctorById(referral.to_resource);
      referral.fromResource = fromResource;
      referral.toResource = toResource;
      return referral;
    });
    return referrals;
  }

  getDoctorById(id) {
    return this.req.jsonDataBase.doctors.find( doctor => doctor._id === id );
  }

  getPatient() {
    const patientFromRequest = utils.getEnvelopeBodyElementValue(this.req, 'patient_data');
    const patientFromJsonFile = this.req.jsonDataBase.patients.find( patient => patient.snils === patientFromRequest.snils);
    return patientFromJsonFile;
  }

  getResponsePath() {
    return path.join(__dirname, 'responses');
  }

  getActiveErrorRule() {
    const operation = this.req.config.operations.find( (operation) => { 
      return operation.request.toLowerCase() === this.req.soapAction;
    });
    const rule = operation.rules.find( (rule) => rule.isActive === true && rule.isError === true );
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
    return `get-referral-info-response.xml`;
  }

  getRenderData() {
    const referral = {
      ...this.referral[0],
      number: this.originalRegerralNumber
    }
    const renderData = {
      ...this.req.renderData,
      referral: [referral],
      patient: this.patient,

    };

    return renderData;
  }

  sendResponse() {
    const renderData = this.renderData || this.req.renderData;
    const renderFile = `${this.responsePath}/${this.responseFile}`;
  
    hb.render(renderFile, renderData)
    .then( (renderedString) => {
      this.res.send(renderedString);
    })
    .catch(err => { 
      console.log(err) 
      this.res.status(500).send(err);
    })
  }


}


module.exports = function(req, res, next){
  const getReferralInfo = new GetReferralInfo(req, res);
  getReferralInfo.sendResponse();
}