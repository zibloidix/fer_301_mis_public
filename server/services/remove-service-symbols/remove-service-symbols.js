function removeServiceSymbols(xml) {
  return xml 
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

module.exports = removeServiceSymbols;
