const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res, next) => {
  const wsdlFilePath = path.join(__dirname, 'wsdl.template.hbs');
  res.set('Content-Type', 'application/xml');
  res.render(
    wsdlFilePath, 
    { 
      protocol: req.protocol,
      url: req.headers.host,
    }
   );
});

module.exports = router;
