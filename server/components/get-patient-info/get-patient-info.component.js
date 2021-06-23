const hb  = require('express-handlebars').create();
const path = require('path');
const utils = require('../../utils');

class PatientInfo {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.renderData = null;
    this.responsePath = this.getResponsePath();
    this.responseFile = 'ERROR_INTERNAL_ERROR.xml';
    this.activeErrorRule = this.getActiveErrorRule();
    if(this.isActiveErrorRule()) {
      this.responseFile = this.getResponseErrorFile();
    } else {
      this.initComponent();
    }
  }

  initComponent() {
    this.patient = this.getPatient();
    if (this.isPatientFinded()) {
      this.birthDateFromRequest = this.getBirthDateFromRequest();
      this.updatePatientBirthDate();
      this.chainSessionIdWithPatient();
      this.passReferral = this.getPassReferral();
      this.responseFile = this.getResponseFile();
      this.referrals = this.getReferrals();
      this.renderData = this.getRenderData();
    }
    else {
      this.responseFile = 'ERROR_PATIENT_NOT_FOUND.xml';
    }
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

  isPatientFinded() {
    return typeof this.patient === 'undefined' ? false : true;
  }

  getBirthDateFromRequest() {
    return this.req.body.envelope.body[this.req.soapAction].patient_data.birth_date;
  }

  updatePatientBirthDate() {
    this.patient.birth_date = this.birthDateFromRequest;
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

  getResponsePath() {
    return path.join(__dirname, 'responses');
  }

  getPassReferral(req) {
    return utils.getEnvelopeBodyElementValue(this.req, 'pass_referral');
  }

  getResponseFile() {
    return `get-patient-info-response-referal-${this.passReferral}.xml`;
  }

  getPatient() {
    const patientFromRequest = utils.getEnvelopeBodyElementValue(this.req, 'patient_data');
    const patientFromJsonFile = this.req.jsonDataBase.patients.find( patient => patient.snils === patientFromRequest.snils.replace(/-| /gi, ''));
    return patientFromJsonFile;
  }

  getReferrals() {
    const { _id } = this.patient;
    const referralsFromJson = this.req.jsonDataBase.referrals
      .filter( referral => referral.show_epgu )
      .filter( referral => referral.patient_id === _id );
    const referralsWithResources = this.attachResourcesToReferrals(referralsFromJson);
    return referralsWithResources;
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

  getRenderData() {
    const renderData = {
      ...this.req.renderData,
      patient_id: this.patient._id,
      referrals: this.referrals
    };

    if (this.passReferral === 1) { renderData.referrals = this.referrals }

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

module.exports = (req, res, next) => {
  const patientInfo = new PatientInfo(req, res);
  patientInfo.sendResponse();
}
