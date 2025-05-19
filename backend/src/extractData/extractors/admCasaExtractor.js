const pdf = require('pdf-parse');

module.exports = async function extractFromClientAdm(buffer) {
  const { text } = await pdf(buffer);
  

  const result = {
    order_number: '',
    order_date: '',
    delivery_address: '',
    delivery_date: '',
    sales_manager: '',
    products: [],
    total_ht: '',
    total_tva:'',
    total_ttc: '',
  };

    // Extract Bon de livraison
    const bonDeCommandeMatch = text.match(/Numéro de Bon de Commande\s*(P\d+)/i);
    if (bonDeCommandeMatch) {
      result.order_number = bonDeCommandeMatch[1].trim();
    }

  // Extract order date
  const orderDateMatch = text.match(/Date de commande\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (orderDateMatch) {
    result.order_date = orderDateMatch[1].trim();
  }


  // Extract Adresse de livraison
  const adresseMatch = text.match(/Adresse de livraison\s*:\s*([\s\S]*?)Responsable achat/i);
  if (adresseMatch) {
    result.delivery_address = adresseMatch[1].trim().replace(/\n+/g, ', ');
  }

  // Extract Responsable achat
  const responsableMatch = text.match(/Responsable achat\s*:\s*(.*)/i);
  if (responsableMatch) {
    result.sales_manager = responsableMatch[1].trim();
  }

  // Extract product lines
  const lines = text.split('\n');
  const productRegex = /^\[(.*?)\]\s+(.*?)TVA\s+\d+%\s+ACHATS(\d{13})(\d+,\d{3})(\d+,\d{2})(\d+,\d{2})(\d+,\d{2})\s+DH$/;

  for (const line of lines) {
    const cleanLine = line.replace(/\s+/g, ' ').trim(); // Normalize whitespace
    
    
    const match = cleanLine.match(productRegex);
    
    
    if (match) {
      // Extract size from the description (e.g., "33CL", "0.5L", "1.5L", etc.)
      const sizeMatch = match[2].trim().match(/(\d+(?:\.?\d*)\s*(?:CL|L))/i);
      const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : '';
      

      result.products.push({
        code: match[3],
        description: match[2].trim(),
        category: '',
        packaging: '',
        quantity: match[4].replace(',', '.'),
        size: size,
        unit: '',
        unit_price: match[5].replace(',', '.'),
        type: '',
        discount: match[6].replace(',', '.'),
        amount: match[7].replace(',', '.')
      });
    }
  }

// Extract total HT
const totalHTMatch = text.match(/Sous-total\s*([\d\s,]+)\s*DH/i);
if (totalHTMatch) {
  result.total_ht = totalHTMatch[1].trim().replace(/\s+/g, '').replace(',', '.');
}

// Extract total TVA
const totalTVAMatch = text.match(/Taxes\s*([\d\s,]+)\s*DH/i);
if (totalTVAMatch) {
  result.total_tva = totalTVAMatch[1].trim().replace(/\s+/g, '').replace(',', '.');
}

// Extract total TTC
if (!result.total_ttc && result.total_ht && result.total_tva) {
  result.total_ttc = (parseFloat(result.total_ht) + parseFloat(result.total_tva)).toFixed(2);
}

  return result;
};