const { v4: uuidv4 } = require('uuid');

function getEnvelopeBodyElementValue(req, elementName) {
  if (typeof req.body.envelope !== 'undefined'){
      return req.body.envelope.body[req.soapAction][elementName];
  }
}

function getAvailableDates(startDateRange) {
    const startDate = new Date(`${startDateRange}T08:00:00`);
    const availableDates = [];

    for(let i=0; i<=14; i++) {
      const date = new Date();
      date.setDate(startDate.getDate() + i);
      const hh = `${date.getHours()}`.padStart(2,'0');
      const mm = `${date.getMinutes()}`.padStart(2,'0');
      const ss = `${date.getSeconds()}`.padStart(2,'0');
      const y = `${date.getFullYear()}`.padStart(2,'0');
      const m = `${date.getMonth() + 1}`.padStart(2,'0');
      const d = `${date.getDate()}`.padStart(2,'0');
      availableDates.push(`${y}-${m}-${d}T08:00:00+11:00`);
    }
    return availableDates;
}

function getSlots(startDateRange, slotsCount = 5) {
    const startDate = new Date(`${startDateRange}T08:00:00`);
    const slots = [];

    for(let i=0; i<=14; i++) {
      const date = new Date();
      date.setDate(startDate.getDate() + i);
      const hh = `${date.getHours()}`.padStart(2,'0');
      const mm = `${date.getMinutes()}`.padStart(2,'0');
      const ss = `${date.getSeconds()}`.padStart(2,'0');
      const y = `${date.getFullYear()}`.padStart(2,'0');
      const m = `${date.getMonth() + 1}`.padStart(2,'0');
      const d = `${date.getDate()}`.padStart(2,'0');
      for(let hourIndex = 8; hourIndex <= slotsCount + 8; hourIndex++) {
        const slotHour = `${hourIndex}`.padStart(2,'0');
        slots.push({
            slot_id: uuidv4(),
            book_id_mis:  uuidv4(),
            visittime: `${y}-${m}-${d}T${slotHour}:00:00+11:00`,
            room: `10${i}`,
            showEpgu: true,
            create_date: null,
            source_record: null

        });
      }
      
    }
    return slots;
}

function getAgeGroup(birthDate) {
  const now = new Date();
  const nowYear = now.getFullYear();
  const birthDateYear = birthDate.split('-')[0];
  const age = parseInt(nowYear) - parseInt(birthDateYear);
  console.log(age);  
  if (age <= 12) {
    return "CHILD"
  }
  if (age >= 13 && age <= 17) {
    return "TEEN"
  }
  if (age >= 18) {
    return "ADULT"
  }
}

function getCurrentDate() {
  const date = new Date();
  const y = `${date.getFullYear()}`.padStart(2,'0');
  const m = `${date.getMonth() + 1}`.padStart(2,'0');
  const d = `${date.getDate()}`.padStart(2,'0');

  return `${y}-${m}-${d}`;
}

function getCurrentDateTime() {
  const date = new Date();
  const hh = `${date.getHours()}`.padStart(2,'0');
  const mm = `${date.getMinutes()}`.padStart(2,'0');
  const ss = `${date.getSeconds()}`.padStart(2,'0');
  const y = `${date.getFullYear()}`.padStart(2,'0');
  const m = `${date.getMonth() + 1}`.padStart(2,'0');
  const d = `${date.getDate()}`.padStart(2,'0');

  return `${y}-${m}-${d}T${slotHour}:00:00+11:00`;
}

function transformToHumanDateTime(dateTime) {
  const date = new Date(dateTime);
  const hh = `${date.getHours()}`.padStart(2,'0');
  const mm = `${date.getMinutes()}`.padStart(2,'0');
  const y = `${date.getFullYear()}`.padStart(2,'0');
  const m = `${date.getMonth() + 1}`.padStart(2,'0');
  const d = `${date.getDate()}`.padStart(2,'0');

  return `${d}.${m}.${y} ${hh}:${mm}`;
}

function getSourceRecordByPatientSessionsCount(patientSessionsCounter = 0) {
  const sourceRecords = ['REG', 'INFOMAT', 'RPGU', 'CC', 'MED_ARM', 'OTHER_WEB'];
  if (patientSessionsCounter < sourceRecords.length) {
    return sourceRecords[patientSessionsCounter];
  }
  return sourceRecords[0];
}


var SOURCE_RECORD_COUNTER = 0;
function getSourceRecordByCounter() {
  const sourceRecords = ['REG', 'INFOMAT', 'RPGU', 'CC', 'MED_ARM', 'OTHER_WEB'];
  if (SOURCE_RECORD_COUNTER >= sourceRecords.length) {
    SOURCE_RECORD_COUNTER = 0;
  } 
  return sourceRecords[SOURCE_RECORD_COUNTER++];
}

module.exports = {
  getSourceRecordByPatientSessionsCount,
  getSourceRecordByCounter,
  transformToHumanDateTime,
  getEnvelopeBodyElementValue,
  getCurrentDateTime,
  getAvailableDates,
  getCurrentDate,
  getAgeGroup,
  getSlots
}