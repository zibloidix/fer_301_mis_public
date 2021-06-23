const hb  = require('express-handlebars').create();
const rp = require('request-promise-native');
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', render);
router.post('/', renderRequestAndSend);

function getRenderData(req, res, next) {
  const hospitals = []

  req.jsonDataBase.hospitals.forEach( hospital => {
    const hospitalClone = {
      ...hospital
    }
    hospitalClone.doctors = req.jsonDataBase.doctors.filter( doctor => doctor.hospital_id === hospital._id );
    hospitals.push(hospitalClone);
  });

  return {
    hospitals
  }
}

function render(req, res, next) {
  const renderData = getRenderData(req, res, next);
  const renderFile = path.join(__dirname, 'get-busy-slots.hbs');

  res.set('Content-Type', 'text/html');
  hb.render(renderFile, renderData)
  .then( (renderedString) => {
    res.send(renderedString);
  })
  .catch(err => { 
    console.log(err) 
    this.res.status(500).send(err);
  })
}

function renderRequestAndSend(req, res, next) {
  const { book_id_mis, service_ids } = req.body;
  const { slot, doctor } = getSlotAndDoctor(book_id_mis, req);
  const room = getRoom(doctor, req);
  const services = getServices(service_ids, doctor, req);
  const hospital = getHospital(doctor, req);
  const renderRequestData = getRenderRequestData(slot, doctor, hospital, services, room, req);
  const renderFile = path.join(__dirname, 'requests', 'update-appointment-status-request.xml');

  res.set('Content-Type', 'text/html');
  hb.render(renderFile, renderRequestData)
  .then( (renderedString) => {
    const requestOptions = {
      method: 'POST',
      uri: process.env.UPDATE_SERVICE_URL,
      body: renderedString,
      headers: {
        'Content-Type': 'text/xml',
        'SOAPAction': 'UpdateAppointmentStatus'
      }
    };
    
     slot.request = renderedString;
    rp(requestOptions)
      .then(function (response) {
        slot.response = response;
        res.send(response);
      })
      .catch(function (err) {
        slot.response = err;
        res.send(err);
      });

  })
  .catch(err => { 
    console.log(err) 
    this.res.status(500).send(err);
  })
}

function getRoom(doctor, req) {
  if (typeof req.body.room_oid !== 'undefined') {
    return doctor.rooms.find( room => room.oid === req.body.room_oid);
  }
  return false;
}

function getServices(service_ids, doctor, req) {
  return doctor.services.filter( service => service_ids.includes(service._id) )
}

function getSlotAndDoctor(book_id_mis, req) {
  let findedSlot = null;
  let findedDoctor = null; 
  req.jsonDataBase.doctors.forEach((doctor) => {
    const slot = doctor.slots.find( slot => slot.book_id_mis === book_id_mis );
    if (typeof slot !== 'undefined') {
      findedSlot = slot;
      findedDoctor = doctor;
    }
  });

  return { slot: findedSlot, doctor: findedDoctor };
}

function getHospital(doctor, req) {
  const { hospital_id } = doctor;
  return req.jsonDataBase.hospitals.find( hospital => hospital._id === hospital_id );
}

function getRenderRequestData(slot, doctor, hospital, services, room, req) {
  return {
    slot,
    room, 
    doctor,
    hospital,
    services,
    ...req.body
  }
}

module.exports = router;