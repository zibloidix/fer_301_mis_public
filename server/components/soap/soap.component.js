const path = require('path');
const fs = require('fs');

const soapActionsRouter = {
  'getpatientinforequest': require('../get-patient-info'),
  'getmoresourceinforequest': require('../get-mo-resource-info'),
  'getscheduleinforequest': require('../get-schedule-info'),
  'createappointmentrequest': require('../create-appointment'),
  'cancelappointmentrequest': require('../cancel-appointment'),
  'getreferralinforequest': require('../get-referral-info'),
  'getmoinfoextendedrequest': require('../get-mo-info-extended'),
  'getservicepostspecsinforequest': require('../get-service-post-specs-info'),
  'referralappointmentinformationrequest': require('../referral-appointment-information'),


  
}

module.exports = (req, res, next) => {
  const { soapAction } = req;
  if (typeof soapActionsRouter[soapAction] === 'indefined') {
    res.status(500).send('Undefined action');
  } else {
    soapActionsRouter[soapAction](req, res, next);
  }
}
