const hb  = require('express-handlebars').create();
const path = require('path');
const utils = require('../../utils');

class GetSheduleInfo {

  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.renderData = null;
    this.slots = [];
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
    this.roomOid = this.getRoomOid();
    this.doctor = this.getDoctor();
    this.room = this.getRoom();
    this.session = this.getSession();
    this.putRoomToTheSession();
    if (this.isDoctorFinded()) {
      this.startDateRange = this.getStartDateRange();
      this.slots = this.getSlots();
      this.putSlotsToDoctor();
      this.responseFile = this.getResponseFile();
      this.renderData = this.getRenderData();
    } else {
      this.responseFile = 'ERROR_SESSION_TIMED_OUT.xml';
    }
  }

  getSlots() {
    if (this.doctor.slots.length > 0) {
      return this.doctor.slots;
    }
    return utils.getSlots(this.startDateRange, 10);
  }

  putSlotsToDoctor() {
    if (this.doctor.slots.length === 0) {
      this.doctor.slots = this.slots;
    }
  }

  getRoomOid() {
    return this.req.body.envelope.body[this.req.soapAction].room_oid;
  }

  getRoom() {
    if (typeof this.roomOid !== 'undefined') {
      return this.getRoomByOid();
    } else {
      return this.getRoomByDoctor();
    }
  }

  getSession() {
    const { UUID_SESSION_ID } = this.req.renderData;
    const patient = this.getPatientBySessionId();
    return patient.sessions.find( session => session._id === UUID_SESSION_ID);
  }

  putRoomToTheSession() {
    this.session.room = this.room;
  }

  getPatientBySessionId() {
    const { UUID_SESSION_ID } = this.req.renderData;
    return this.req.jsonDataBase.patients
      .find( patient => patient.sessions.find( session => session._id === UUID_SESSION_ID));
  }

  getRoomByOid() {
    return this.doctor.rooms.find( room => room.oid === this.roomOid );
  }

  getRoomByDoctor() {
    return this.doctor.rooms[0];
  }

  getDoctorBySnilsHospitalIdPostId() {
    const post_id = this.req.body.envelope.body[this.req.soapAction].service_post.post.post_id;
    const snils = this.req.body.envelope.body[this.req.soapAction].specialist_snils;
    const hospital = this.getHospitalByOid();
    return this.req.jsonDataBase.doctors
      .find( doctor => doctor.snils === snils
                    && doctor.hospital_id === hospital._id
                    && doctor.post_id === post_id);
  }

  getDoctorByRoomOidMOOidSpecialtyId() {
    const hospital = this.getHospitalByOid();
    const specialty_id = this.getSpecialtyIdFromRequest();
    return this.req.jsonDataBase.doctors.find( doctor => doctor.hospital_id === hospital._id
                                                      && doctor.specialty_id === specialty_id
                                                      && doctor.rooms.some( room => room.oid === this.roomOid) );

  }

  getSpecialtyIdFromRequest() {
    if (typeof this.req.body.envelope.body[this.req.soapAction].service_specialty !== 'undefined') {
      return this.req.body.envelope.body[this.req.soapAction].service_specialty.specialty_id;
    }
  }

  getDoctor() {
    if (typeof this.roomOid !== 'undefined') {
      return this.getDoctorByRoomOidMOOidSpecialtyId();
    } else {
      return this.getDoctorBySnilsHospitalIdPostId();
    }
  }

  getHospitalByOid() {
    const hospital_oid = this.req.body.envelope.body[this.req.soapAction].mo_oid;
    return this.req.jsonDataBase.hospitals.find( hospital => hospital.oid === hospital_oid );
  }

  getStartDateRange() {
    return this.req.body.envelope.body[this.req.soapAction].start_date_range;
  }

  isDoctorFinded() {
    return typeof this.doctor === 'undefined' ? false : true;
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
    return `get-schedule-info-response.xml`;
  }

  getRenderData() {
    const renderData = {
      ...this.req.renderData,
      room: this.room,
      slots: this.slots
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
  const getSheduleInfo = new GetSheduleInfo(req, res);
  getSheduleInfo.sendResponse();
}