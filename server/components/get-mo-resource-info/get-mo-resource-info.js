const hb  = require('express-handlebars').create();
const path = require('path');
const utils = require('../../utils');

class GetMOResourceInfo {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.renderData = null;
    this.availableDates = [];
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
    this.patient = this.getPatientBySessionId();
    if (this.isPatientFinded()) {
      this.referral = this.getRegerralById();
      this.isShowRoom = this.isShowRoom();
      this.hospital = this.getHospitalByOid();
      this.doctors = this.getDoctors();
      this.startDateRange = this.getStartDateRange();
      this.availableDates = utils.getAvailableDates(this.startDateRange);
      this.responseFile = this.getResponseFile();
      this.renderData = this.getRenderData();
    } else {
      this.responseFile = 'ERROR_SESSION_TIMED_OUT.xml';
    }
    
  }

  getDoctors() {
    if (this.isShowRoom) {
      return this.getDoctorsByspecialtyIdAndHospitalOid();
    } else {
      if (this.isReferralUnavailable()) {
        return this.getOtherAvailableDoctorByPostIdAndHospitalOid();
      }
      return this.getDoctorsByPostIdAndHospitalOid();
    }
  }

  isReferralUnavailable() {
    if (typeof this.referral !== 'undefined') {
      return this.referral.available_record === "UNAVAILABLE";
    }
  }

  getOtherAvailableDoctorByPostIdAndHospitalOid() {
    const docotrs = this.getDoctorsByPostIdAndHospitalOid()
    return docotrs.filter( doctor => doctor._id !== this.referral.toResource._id );
  }

  getDoctorsByspecialtyIdAndHospitalOid() {
    const specialtyIdFromRequest = this.getSpecialtyIdFromRequest();
    const doctors = this.req.jsonDataBase.doctors
      .filter( doctor => doctor.hospital_id === this.hospital._id 
                      &&  doctor.specialty_id === specialtyIdFromRequest );
    return doctors;
  }

  getDoctorsByPostIdAndHospitalOid() {
    const postIdsFromRequest = this.getPostIdsFromRequest();
    const doctors = this.req.jsonDataBase.doctors
      .filter( doctor => doctor.hospital_id === this.hospital._id 
                      && postIdsFromRequest.includes(doctor.post_id) );
    return doctors;
  }

  getStartDateRange() {
    return this.req.body.envelope.body[this.req.soapAction].start_date_range;
  }

  getPostIdsFromRequest() {
    if (typeof this.req.body.envelope.body[this.req.soapAction].service_posts !== 'undefined') {
      const post_ids = [this.req.body.envelope.body[this.req.soapAction].service_posts.post].flat();
      return post_ids.map( post_id => post_id.post_id );
    }
    return [];
  }

  getSpecialtyIdFromRequest() {
    if (typeof this.req.body.envelope.body[this.req.soapAction].service_specialty !== 'undefined') {
      return this.req.body.envelope.body[this.req.soapAction].service_specialty.specialty_id;
    }
  }

  isPatientFinded() {
    return typeof this.patient === 'undefined' ? false : true;
  }

  getRegerralById() {
    const id = this.req.body.envelope.body[this.req.soapAction].referral_id;
    return this.req.jsonDataBase.referrals.find( referral => referral._id === id );
  }

  isShowRoom() {
    if (typeof this.referral !== 'undefined') {
      return this.referral.type === '4';
    }
    return false;
  }

  getHospitalByOid() {
    const oid = this.req.body.envelope.body[this.req.soapAction].mo_oid_list.mo_oid;
    return this.req.jsonDataBase.hospitals.find( hospital => hospital.oid === oid );
  }

  getPatientBySessionId() {
    const { UUID_SESSION_ID } = this.req.renderData;
    return this.req.jsonDataBase.patients
      .find( patient => patient.sessions.find( session => session._id === UUID_SESSION_ID));
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
    if (this.isShowRoom) {
      return `get-mo-resource-info-response-room.xml`;
    }
    return `get-mo-resource-info-response-specialist.xml`;
  }

  getRenderData() {
    const renderData = {
      ...this.req.renderData,
      hospital: this.hospital,
      doctors: this.doctors,
      available_dates: this.availableDates
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
  const getMOResourceInfo = new GetMOResourceInfo(req, res);
  getMOResourceInfo.sendResponse();
}