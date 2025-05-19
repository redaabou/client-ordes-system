const path = require('path');
const fs = require('fs');
const detectPdfType = require('./pdfTypeDetector');

// Automatically load all extractors
const extractors = {};

// Path to the 'extractors' directory
const extractorsDir = path.join(__dirname, 'extractors');

const files = fs.readdirSync(extractorsDir);

for (const file of files) {
  if (
    file.endsWith('Extractor.js')
  ) {
    // Turn 'admCasaExtractor.js' into 'adm casa'
    const clientKey = file
      .replace('Extractor.js', '')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toLowerCase();

    extractors[clientKey] = require(path.join(extractorsDir, file));
  }
}

function getExtractor(client_name) {
  const key = client_name.trim().toLowerCase();
  const extractor = extractors[key];

  if (!extractor) {
    throw new Error(`Unknown client: "${client_name}"`);
  }

  return extractor;
}

async function extractData(client_name, pdfBuffer) {

    // Step 1: Detect PDF type
  const pdfType = await detectPdfType(pdfBuffer);
  

    // Step 2: Use the detected type to select the extractor
  if (pdfType && extractors[pdfType]) {
    return await extractors[pdfType](pdfBuffer);
  }

    // Step 3: Fallback to client name if PDF type is not detected
  const extractor = getExtractor(client_name);
  return await extractor(pdfBuffer);

  
}

module.exports = {
  extractData,
};
