const pdf = require('pdf-parse');

async function detectPdfType(buffer) {
  try {
    const { text } = await pdf(buffer);
    
    // Check for Rezoroute documents (ADM, Atlas, etc)
    if (/numéro de bon de commande/i.test(text)) {
      if (/adm casa/i.test(text)) {
        return 'adm casa';
      } else if (/adm assilah/i.test(text)) {
        return 'ADM ASSILAH';
      } else if (/atlas bottling company/i.test(text)) {
        return 'ATLAS BOOTLING';
      } else if (/aire tangeroise/i.test(text)) {
        return 'AIRE TANGEROISE';
      } else if (/tanger ville/i.test(text)) {
        return 'TANGER VILLE';
      } else if (/mnar tanger/i.test(text)) {
        return 'MNAR TANGER';
      } else {
        return 'REZOROUTE GENERAL';
      }
    }
    
    // Check for CBGS format
    if (/cbgs/i.test(text) && /bon de commande/i.test(text) && /n°: *[0-9]/i.test(text)) {
      return 'CBGS';
    }
    
    // Check for Hospitality/Palm's Friends format
    if (/palm's friends/i.test(text) && /bon de commande/i.test(text)) {
      return 'HOSPITALITY';
    }
    
    // Check for LBP format
    if (/bon de commande n°:/i.test(text) && /lbp gourmets/i.test(text)) {
      return 'LBP';
    }
    
    // Check for Newrest format
    if (/purchase order no/i.test(text) && /newrest/i.test(text)) {
      return 'NEWREST';
    }
    
    // Generic beverage order format as fallback
    if (/coca cola/i.test(text) && /sprite|schweppes|fanta/i.test(text) && /prix|price/i.test(text)) {
      return 'GENERIC BEVERAGE ORDER';
    }
    
    // Unknown format
    return 'UNKNOWN';
  } catch (error) {
    console.error('Error detecting PDF type:', error);
    return 'ERROR';
  }
}

module.exports = detectPdfType;