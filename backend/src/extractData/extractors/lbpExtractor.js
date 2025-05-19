const pdf = require('pdf-parse');

function FrenchDecimal(str) {
  return str.replace(',', '.');
}


module.exports = async function extractFromLbp(buffer) {
  const { text } = await pdf(buffer);

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

  const headerMatch = text.match(/BON DE COMMANDE N\u00b0:\s*(\d+)\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (headerMatch) {
    result.order_number = headerMatch[1];
    result.order_date = headerMatch[2];
  }

  const respMatch = text.match(/Responsable\s*:\s*(.+)/i);
  if (respMatch) {
    result.sales_manager = respMatch[1].trim();
  }

  const addressMatch = text.match(/Responsable\s*:\s*.+\n([\s\S]*?)\nCode APE:/);
  if (addressMatch) {
    result.delivery_address = addressMatch[1]
      .replace(/\n+/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const productLines = text.match(/^.+?\d+,\d{4}\D+\d+,\d{2}\D+\d{1,3}(?: \d{3})?,\d{2}$/gm);
  if (productLines) {
    for (const line of productLines) {
      const match = line.match(/^(.+?)\s+(\d+,\d{4})\D+(\d+,\d{2})\D+(\d{1,3}(?: \d{3})?,\d{2})$/);
      if (match) {
        const [_, description, unitPrice, quantity, total] = match;
        result.products.push({
          description: description.trim(),
          unit_price:FrenchDecimal(unitPrice) ,
          quantity: FrenchDecimal(quantity),
          amount: FrenchDecimal(total)
        });
      }
    }
  }

  const total_htMatch = text.match(/Total HT \u20ac?\s*:\s*([\d\s,]+)/i);
  if (total_htMatch) {
    result.total_ht = total_htMatch[1].replace(/\s/g, '').replace(',', '.');
  }

  return result;
};
