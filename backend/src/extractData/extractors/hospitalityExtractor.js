const pdf = require("pdf-parse");

function parseFrenchNumber(str) {
  return parseFloat(str.replace(/\s/g, '').replace(',', '.')).toFixed(2);
}


module.exports = async function extractFromClientHospitality(buffer) {
  const { text } = await pdf(buffer);
  console.log('Extracting data from client ...', text );

  const flatText = text.replace(/\n\s+/g, " ").replace(/\s+/g, " ").trim();

  const result = {
    order_number: "",
    order_date: "",
    delivery_address: "",
    delivery_date: "",
    sales_manager: "",
    products: [],
    total_ht: "",
    total_tva: "",
    total_ttc: "",
  };

  // Extract Bon de livraison
  const bonDeCommandeMatch = flatText.match(/BCN°\s*[:\-]?\s*([^\s]+)/i);
  if (bonDeCommandeMatch) {
    result.order_number = bonDeCommandeMatch[1].trim();
  }

  // Extract order date
  const dateMatch = flatText.match(
    /DATE\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i
  );
  if (dateMatch) {
    result.order_date = dateMatch[1].trim();
  }

  // Extract Adresse de livraison
  const addressMatch = text.match(/ADRESSE DE LIVRAISON\s*:\s*([^\n]*)\n([^\n]*)/i);
  if (addressMatch) {
    result.delivery_address = (addressMatch[1] + ' ' + addressMatch[2]).trim();
  }

  // Extract Responsable achat
  const responsableMatch = flatText.match(/Qui : (.+?)(?=\s*Page|$)/);
  if (responsableMatch) {
    result.sales_manager = responsableMatch[1].trim();
  }

  // 5. Extract Products
const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
for (const line of lines) {
    // Match both formats: "25*18" and "25CL"
    const match = line.match(/^(.+?)((?:\d+\*\d+|\d+CL))(PACK|BT|CAISSE|CARTON)(\d)(\d{2},\d{2})\s+([\d,]+)/);
    console.log('Match:', match);
    if (match) {
        const [, description, format, unit, qty, unitPrice, montant] = match;

        result.products.push({
            code: "",
            description: description.trim(),
            category: "",
            packaging: format, // Will be either "25*18" or "25CL"
            quantity: parseFloat(qty).toFixed(2),
            size: "",
            unit: unit,
            unit_price: parseFrenchNumber(unitPrice),
            discount: "",
            amount: parseFrenchNumber(montant)
        });
    }
}

  // Extract total HT
  const totalHTMatch = text.match(/TOTAL HT\s*([\d,]+)/i);
  if (totalHTMatch) {
    result.total_ht = totalHTMatch[1]
      .trim()
      .replace(/\s+/g, "")
      .replace(",", ".");
  }

  // Extract total TVA
  const totalTVAMatch = flatText.match(/TVA(\d+\.\d{2})/);
  if (totalTVAMatch) {
    result.total_tva = totalTVAMatch[1]
      .trim()
      .replace(/\s+/g, "")
      .replace(",", ".");
  }

  // Extract total TTC
  const lineHaveTotalTTMatch = flatText.match(
    new RegExp(`${result.total_ht}.*${result.total_tva}.*\\d+\\.\\d{2}`)
  );

  if (lineHaveTotalTTMatch) {
    const lineWithTotals = lineHaveTotalTTMatch[0];

    // Extract all numeric values from the line
    const numericValues = lineWithTotals.match(/\d+\.\d{2}/g);
    if (numericValues) {
      // The last numeric value is the totalTTC
      const totalTTC = numericValues[numericValues.length - 1];
      result.total_ttc = totalTTC;
    } else {
      console.error("Failed to extract numeric values from the line.");
    }
  } else {
    console.error(
      "Failed to find the line containing totalHT, totalTVA, and totalTTC."
    );
  }

  // const totalTTMatch = flatText.match(/TOTAL MAD\s+([\d,]+\.\d{2})/i);
  // result.total_ttc = totalTTMatch?.[1].replace(',', '.') || '';

  return result;
};
