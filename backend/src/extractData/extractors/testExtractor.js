const pdf = require('pdf-parse');
const fs = require('fs');

module.exports = async function extractFromRoyalMansour(buffer) {
  const { text } = await pdf(buffer);
  console.log("Extracted text:", text);

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

  const lines = text
    .replace(/\r\n|\r/g, '\n')
    .replace(/[ ]{2,}/g, ' ')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  // Normalize whitespace for easier parsing
  const normalizedText = text.replace(/\r\n|\r/g, '\n').replace(/[ ]{2,}/g, ' ');

  // 1. ORDER NUMBER
  const orderNumberLine = lines.find(line => /bon de commande/i.test(line));
  if (orderNumberLine) {
    const idx = lines.indexOf(orderNumberLine);
    result.order_number = (lines[idx + 1] || '').trim();
  }

  // 2. ORDER + DELIVERY DATES
  const dateLine = lines.find(l => /date de commande/i.test(l));
  if (dateLine) {
    const matches = dateLine.match(/(\d{2}\/\d{2}\/\d{4})/g);
    if (matches?.[0]) result.order_date = matches[0];
    if (matches?.[1]) result.delivery_date = matches[1];
  }

  // 3. DELIVERY ADDRESS
  const addressIdx = lines.findIndex(l =>
    /Responsable Achat/i.test(l) &&
    lines[l + 1]?.includes('MANSOUR')
  );
  if (addressIdx >= 0) {
    result.delivery_address = lines
      .slice(addressIdx + 1, addressIdx + 4)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 4. SALES MANAGER (heuristic only)
  const salesMatch = lines.find(l => /Responsable Achat/i.test(l));
  if (salesMatch) {
    const next = lines[lines.indexOf(salesMatch) + 1];
    if (next && next.toLowerCase().includes("mansour")) {
      result.sales_manager = "MANSOUR CASABLANCA"; // fallback logic
    }
  }

  // 5. Extract Products
  const productSectionMatch = normalizedText.match(/Produits Commandés\s*(.*?)\n\s*Direction Générale/is);
  if (productSectionMatch) {
    const productLines = productSectionMatch[1].split('\n').map(line => line.trim()).filter(Boolean);
    for (let i = 0; i < productLines.length; i++) {
      const line = productLines[i];

      // Match product line
      const productMatch = line.match(/^([\d,]+)%([\d\s,]+)(\d{7})\s+(.*)$/);
      if (productMatch) {
        const [_, unit_price, amount, code, description] = productMatch;
        let nextLine = productLines[i + 1] || '';
        let nextNextLine = productLines[i + 2] || '';
        let quantity = '';
        let unit = '';
        let packaging = '';
        let size = '';
        let discount = '0,00%';

        // Try to extract unit/size from following lines
        if (/Bottle|CANNETTE/i.test(nextLine)) {
          unit = nextLine.trim();
          quantity = nextNextLine.match(/[\d,]+/) ? nextNextLine.trim() : '';
        } else {
          quantity = nextLine.match(/[\d,]+/) ? nextLine.trim() : '';
        }

        result.products.push({
          code: code.trim(),
          description: description.trim(),
          category: "",
          packaging: packaging,
          quantity: quantity,
          size: size,
          unit: unit,
          unit_price: unit_price.trim(),
          discount: discount,
          amount: amount.trim(),
        });
      }
    }
  }

  // 6. Extract Totals
  const totalHTMatch = normalizedText.match(/Total HT\s*[:：]?\s*([\d\s,]+)/i);
  if (totalHTMatch) result.total_ht = totalHTMatch[1].trim();

  const totalTVAMatch = normalizedText.match(/Total TVA\s*[:：]?\s*([\d\s,]+)/i);
  if (totalTVAMatch) result.total_tva = totalTVAMatch[1].trim();

  const totalTTCMatch = normalizedText.match(/Total TTC\s*[:：]?\s*([\d\s,]+)/i);
  if (totalTTCMatch) result.total_ttc = totalTTCMatch[1].trim();

  return result;    
};
