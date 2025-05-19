const pdf = require('pdf-parse'); 


function normalize(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

// Helper function to extract numbers from text
function extractNumber(text) {
  if (!text) return '';
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  return match ? match[1] : '';
}

// Helper function to find a line containing a pattern
function findLine(lines, pattern) {
  return lines.findIndex(line => line.toLowerCase().includes(pattern.toLowerCase()));
}

// Helper function to extract data based on labels
function extractDataByLabel(lines, labels, nextLineOffset = 0) {
  for (const label of labels) {
    const index = findLine(lines, label);
    if (index !== -1 && index + nextLineOffset < lines.length) {
      return normalize(lines[index + nextLineOffset]);
    }
  }
  return '';
}

// Helper function to extract data from the same line after a label
function extractDataAfterLabel(lines, labels) {
  for (const label of labels) {
    for (const line of lines) {
      if (line.toLowerCase().includes(label.toLowerCase())) {
        const parts = line.split(label);
        if (parts.length > 1) {
          return normalize(parts[1]);
        }
      }
    }
  }
  return '';
}

module.exports = async function extractFromPaul(buffer) {
  const { text } = await pdf(buffer);
  

  // Split the text into lines for easier processing
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  
  

  // Initialize the result object with standardized field names
  const result = {
    order_number: '',
    order_date: '',
    delivery_address: '',
    delivery_date: "",
    sales_manager: '',
    products: [],
    total_ht: '',
    total_tva: '',
    total_ttc: ''
  };

  // 1. Extract Order Number - try multiple approaches
  result.order_number = 
    extractDataByLabel(lines, ['N° COMMANDE', 'NUMERO COMMANDE', 'NO COMMANDE'], 1) || 
    extractDataAfterLabel(lines, ['N° COMMANDE:', 'NUMERO COMMANDE:', 'NO COMMANDE:']);

  if (result.order_number) {
    const match = text.match(/[A-Z]+-[A-Z]+-\d+/g);
    if (match) {
      result.order_number = match[0];
    } else {
      result.order_number = "";
    }
  }

  // 2. Extract Date - try multiple date formats and labels
  const dateLabels = ['DATE COMMANDE', 'DATE DE COMMANDE', 'COMMANDE DU'];
  result.order_date = extractDataAfterLabel(lines, dateLabels);
  
  
  if (!result.order_date) {
    // Try to find a date pattern in the text
    for (const line of lines) {
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch && line.toLowerCase().includes('commande')) {
        result.order_date = dateMatch[1];
        break;
      }
    }
  }

  // 3. Extract Delivery Address - look for common address indicators
  const match = text.match(/N° COMMANDE\s+([\s\S]+?)\s+[A-Z]+-[A-Z]+-\d+/);

  if (match) {
    result.delivery_address = match[1].trim();
  } else {
    result.delivery_address = "";
  }

  // 4. Extract Delivery Date - look for common delivery date indicators
  const deliveryDateLabels = ['LIVRAISON', 'DATE  LIVRAISON', 'LIVRAISON AU PLUS TARD'];
  result.delivery_date = extractDataByLabel(lines, deliveryDateLabels).replace(/DATE\s+LIVRAISON/g, '');
  

  if (!result.delivery_date) {
    // Try to find a date pattern in the text
    for (const line of lines) {
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch && line.toLowerCase().includes('livraison')) {
        result.delivery_date = dateMatch[1];
        break;
      }
    }
  }

  // 4. Extract Responsible Person - if available
  result.sales_manager = extractDataByLabel(lines, 
    ['RESPONSABLE', 'ACHETEUR', 'CONTACT', 'DEMANDEUR'], 1) ||
    extractDataAfterLabel(lines, 
    ['RESPONSABLE:', 'ACHETEUR:', 'CONTACT:', 'DEMANDEUR:']);

  // 5. Extract products - look for lines containing "UNIT"
const productLines = lines.filter(line => line.includes('UNIT'));

for (const line of productLines) {
  // Extract description (everything before "(UNIT)")
  const descriptionMatch = line.match(/^(.+?)\s+\(UNIT\)/i);
  const description = descriptionMatch ? normalize(descriptionMatch[1]) : '';

  // Extract the part containing amount, unit_price, and TVA (last part of the line)
  const valuesMatch = line.match(/(\d{1},\d{2})(\d{1,3},\d{2})20$/);
  
  if (valuesMatch) {
    const unit_price = valuesMatch[1]; // First number with a comma
    const amount = valuesMatch[2]; // Second number with a comma

    // Calculate quantity (amount / unit_price)
    const montantValue = parseFloat(amount.replace(',', '.'));
    const prixUnitaireValue = parseFloat(unit_price.replace(',', '.'));
    const quantity = (montantValue / prixUnitaireValue).toFixed(0); // Round to nearest integer

    // Add the product with standardized field names
    result.products.push({
      code: '',
      barcode: '',
      description: description,
      category: '',
      packaging: '',
      quantity: quantity,
      size: '',
      unit: 'UNIT',
      unit_price: unit_price,
      discount: '',
      tva: '',
      amount: amount,
    });
  }
}
  

  

  // 6. Extract Totals - look for total indicators
  const totalHTLabels = ['TOTAL HT', 'TOTAL H.T.', 'MONTANT HT'];
  const totalTVALabels = ['TOTAL TVA', 'MONTANT TVA', 'TVA'];
  const totalTTCLabels = ['TOTAL TTC', 'TOTAL T.T.C.', 'MONTANT TTC'];
  
  // Extract total HT
  for (const label of totalHTLabels) {
    for (const line of lines) {
      if (line.includes(label)) {
        const match = line.match(/(\d{1,3}(?:[\s.,]\d{3})*(?:[\s.,]\d+))\s*MAD/);
        if (match) {
          result.total_ht = match[1].replace(/\s/, '').replace(',', '.');
          break;
        }
      }
    }
    if (result.total_ht) break;
  }
  
  // Extract total TVA
  for (const label of totalTVALabels) {
    for (const line of lines) {
      if (line.includes(label)) {
        const matches = line.match(/(\d{1,3}(?:[\s.,]\d{3})*(?:[\s.,]\d+))/g);
        if (matches && matches.length > 1) {
          result.total_tva = matches[matches.length - 1];
          break;
        }
      }
    }
    if (result.total_tva) break;
  }
  
  // Extract total TTC
  for (const label of totalTTCLabels) {
    for (const line of lines) {
      if (line.includes(label)) {
        const match = line.match(/(\d{1,3}(?:[\s.,]\d{3})*(?:[\s.,]\d+))\s*MAD/);
        if (match) {
          result.total_ttc = match[1] ;
          break;
        }
      }
    }
    if (result.total_ttc) break;
  }

  return result;
};