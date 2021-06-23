const hb  = require('express-handlebars').create();
const path = require('path');
const utils = require('../../utils');

class CancelAppointment {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.renderData = null;
    this.slot = undefined;
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
    this.getSlotByBookIdMis();
    if (this.isSlotFinded()) {
      this.setSlotNotBusy();
      this.removeBusySlotFromPatient();
      this.responseFile = this.getResponseFile();
    } else {
      this.responseFile = 'RECORD_CANNOT_CANCELED.xml';
    }
    this.renderData = this.getRenderData();
  }

  getBookIdMis() {
    return this.req.body.envelope.body[this.req.soapAction].book_id_mis;
  }

  getPatientByBookIdMis() {
    return this.req.jsonDataBase.patients
      .find( patient => patient.slots.find( session => session._id === UUID_SESSION_ID));
  }

  getSlotByBookIdMis() {
    return this.req.jsonDataBase.doctors.forEach((doctor) => {
      const slot = doctor.slots.find( slot => slot.book_id_mis === this.bookIdMis );
      if (typeof slot !== 'undefined') {
        this.slot = slot;
      }
    });
  }

  isSlotFinded() {
    return typeof this.slot === 'undefined' ? false : true;
  }

  setSlotNotBusy() {
    if (this.isSlotFinded()) {
      this.slot.showEpgu = true;
    }
  }

  removeBusySlotFromPatient() {
    this.req.jsonDataBase.patients.forEach((patient) => {
      if (patient.slots.some( slot => slot.book_id_mis === this.bookIdMis )) {
        patient.slots = patient.slots.filter( slot => slot.book_id_mis !== this.bookIdMis );
      }
    });
  }

  isActiveErrorRule() {
    return typeof this.activeErrorRule === 'undefined' ? false : true;
  }

  getResponseErrorFile() {
    const { base } = path.parse(this.activeErrorRule.path);
    return base;
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

  getResponseFile() {
    return `cancel-appointment-response.xml`;
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
  const cancelAppointment = new CancelAppointment(req, res);
  cancelAppointment.sendResponse();
}