const hb  = require('express-handlebars').create();
const path = require('path');
const utils = require('../../utils');

class CreateAppontment {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.renderData = null;
    this.slot = null;
    this.age_groups = [
      {
        _id: "CHILD",
        min: 0,
        max: 12
      },
      {
        _id: "TEEN",
        min: 13,
        max: 17
      },
      {
        _id: "ADULT",
        min: 18,
        max: 150
      }
    ]

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
    this.slotId = this.getSlotId();
    this.session = this.getSession();
    this.getSlotById();
    if (this.isSlotFinded()) {
      this.doctor = this.getDoctorBySlot();
      this.patient = this.getPatientBySessionId();
      this.hospital = this.getHospitalByDoctor();
      this.errorAgeGroup = this.getErrorAgeGroup();
      this.errorRegSpecialist = this.getErrorRegSpecialist();
      this.setSlotBusy();
      this.responseFile = this.getResponseFile();
      this.renderData = this.getRenderData();
      this.insertSlotToPatient();
    } else {
      this.responseFile = 'ERROR_INTERNAL_ERROR.xml';
    }
  }

  getSession() {
    const { UUID_SESSION_ID } = this.req.renderData;
    const patient = this.getPatientBySessionId();
    return patient.sessions.find( session => session._id === UUID_SESSION_ID);
  }


  getPatientBySessionId() {
    const { UUID_SESSION_ID } = this.req.renderData;
    return this.req.jsonDataBase.patients
      .find( patient => patient.sessions.find( session => session._id === UUID_SESSION_ID));
  }

  setSlotBusy() {
    if (this.isAppointPatientRegisteredOtherSpecialist() === false && this.isAppointPatientRegisteredSpecialist() === false) {
      this.slot.showEpgu = false;
      this.slot.create_date = utils.getCurrentDate();
      this.slot.source_record = utils.getSourceRecordByCounter(); 
    }
  }

  insertSlotToPatient() {
    if (this.isAppointPatientRegisteredOtherSpecialist() === false && this.isAppointPatientRegisteredSpecialist() === false) {
      const { slots, ...doctor } = this.doctor;
      this.patient.slots.push({
        ...this.slot,
        doctor: {
          ...doctor
        }
      })
    }
  }

  isAppointTimeAvailablePatientOtherAge() {
    const lpuAgeGroup = this.hospital.age_group;
    if (lpuAgeGroup === 'ALL') {
      return false;
    } else {
      const patientAgeGroup = utils.getAgeGroup(this.patient.birth_date);
      return !lpuAgeGroup.includes(patientAgeGroup)
    }
  }

  isAppointPatientRegisteredOtherSpecialist() {
    const userBusySlotByTime = this.getPatientSlotByTime();
    if (typeof userBusySlotByTime !== 'undefined') {
      return true;
    }
    return false;
  }

  isAppointPatientRegisteredSpecialist() {
    const doctor = this.getDoctorBySlot();
    return this.patient.slots.some( slot => slot.doctor.post_id === doctor.post_id );
  }

  getPatientSlotByTime() {
    const { visittime } = this.slot;
    return this.patient.slots.find( slot => slot.visittime === visittime);
  }

  getPatientSlotDoctorByPostId() {
    const doctor = this.getDoctorBySlot();
    const busySlot = this.patient.slots.find( slot => slot.doctor.post_id === doctor.post_id );
    busySlot.doctor = {
      ...doctor
    }
    return busySlot;
  }

  getSlotId() {
    return this.req.body.envelope.body[this.req.soapAction].slot_id;
  }

  getSlotById() {
    return this.req.jsonDataBase.doctors.forEach((doctor) => {
      const slot = doctor.slots.find( slot => slot.slot_id === this.slotId );
      if (typeof slot !== 'undefined') {
        this.slot = slot;
      }
    });
  }

  getDoctorBySlot() {
    return this.req.jsonDataBase.doctors
      .find( doctor => doctor.slots.find( slot => slot._id === this.slot._id) );
  }

  getHospitalByDoctor() {
    return this.req.jsonDataBase.hospitals.find( hospital => hospital._id === this.doctor.hospital_id );
  }

  getErrorAgeGroup() {
    const ageRange = [];
    this.hospital.age_group.split(',').forEach( ageGroup => {
      const ageGroupIdRange = this.age_groups.find( group => group._id === ageGroup);
      if (typeof ageGroupIdRange !== 'undefined') {
        ageRange.push(ageGroupIdRange.min);
        ageRange.push(ageGroupIdRange.max);
        ageRange.sort((a,b) => {
          if (a < b) { return -1 }
          if (a > b) { return 1 }
          return 0;
        });
        
      }
    });
    return { 
      min: ageRange.shift(),
      max: ageRange.pop()
    }
  }

  getErrorRegSpecialist() {
    const patientBusySlot = this.getPatientSlot();
    if (typeof patientBusySlot !== 'undefined') {
      const { visittime, create_date, source_record, room } = patientBusySlot;
      const { last_name, first_name, middle_name, inner_name, slot_id  } = patientBusySlot.doctor;
      return {
        slot_id,
        specialist: `${last_name} ${first_name} ${middle_name}`,
        post: inner_name,
        room,
        service: patientBusySlot.doctor.services[0].name,
        visit_time_human: utils.transformToHumanDateTime(visittime),
        visit_time: visittime,
        create_date,
        source_record,
      }
    }
  }

  getPatientSlot() {
    if (this.isAppointPatientRegisteredOtherSpecialist()) {
      return this.getPatientSlotByTime();
    }
    if (this.isAppointPatientRegisteredSpecialist()) {
      return this.getPatientSlotDoctorByPostId();
    }
  }


  isSlotFinded() {
    return typeof this.slot === 'undefined' ? false : true;
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
    if (this.isAppointTimeAvailablePatientOtherAge()) {
      return 'APPOINT_TIME_AVAILABLE_PATIENT_OTHER_AGE.xml';
    }
    if (this.isAppointPatientRegisteredOtherSpecialist()) {
      return 'APPOINT_PATIENT_REGISTERED_OTHER_SPECIALIST.xml';
    }
    if (this.isAppointPatientRegisteredSpecialist()) {
      return 'APPOINT_PATIENT_REGISTERED_SPECIALIST.xml';
    }
    
    return `create-appointment-response.xml`;
  }

  getRenderData() {
    const renderData = {
      ...this.req.renderData,
      errorAgeGroup: this.errorAgeGroup,
      errorRegSpecialist: this.errorRegSpecialist,
      room: this.session.room,
      slot: this.slot
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
  const createAppontment = new CreateAppontment(req, res);
  createAppontment.sendResponse();
}