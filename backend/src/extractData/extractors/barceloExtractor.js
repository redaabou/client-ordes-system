const pdf = require('pdf-parse');

function normalize(str) {
  return str.replace(/\s+/g, ' ').trim();
}

module.exports = async function extractFromClientAdm(buffer) {
  const { text } = await pdf(buffer);
  // console.log('Extracting data from client ...', text );

  const flatText = text.replace(/\n\s+/g, ' ').replace(/\s+/g, ' ').trim();
  
  

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
    const bonDeCommandeMatch = text.match(/COMMANDE.*?Nº(\d+)/i);
    if (bonDeCommandeMatch) {
      result.order_number = bonDeCommandeMatch[1].trim();
    }

  // Extract order date
  const orderDateMatch = text.match(/Données Commande\s*Date(\d{2}\.\d{2}\.\d{4})/i);
  if (orderDateMatch) {
    result.order_date = orderDateMatch[1].trim();
  }


  // Extract Adresse de livraison
  const adresseMatch = flatText.match(/Données facturation.*?Adresse(.*?)(?=Données Commande)/i);
  if (adresseMatch) {
    result.delivery_address = adresseMatch[1] || '';
  }

  // Extract Responsable achat
  const responsableMatch = flatText.match(/Resp\. Achats([^T]+)/i);
  if (responsableMatch) {
    result.sales_manager = responsableMatch[1].trim();
  }
  // 5. Extract Products
  const productBlockMatch = text.match(/PosD\.Livr\.ArticleDescription ArticleQtité\.UMPrixMon\.TVA([\s\S]+?)ECONOMAT/i);
  if (productBlockMatch) {
    const productBlock = productBlockMatch[1].trim();
    // Split the block into lines
    const rawLines = productBlock.split('\n');
    // remove all the line with unpair index
    const filteredLines = rawLines.filter((line, index) => index % 2 == 0);
    
    for (const line of filteredLines) {
      const cleanLine = line.replace(/\s+/g, ' ').trim();

      let processLine = "";
      // 1. Extract date and the part before the date is Pos 
      const dateMatch = cleanLine.match(/(\d{2}\.\d{2}\.\d{4})/);
      if (dateMatch) {
        // Remove the date and the part before the date (including the preceding number)
        processLine = cleanLine.replace(/^\d+\.\d{2}\.\d{4}/, '').trim();
        result.delivery_date = dateMatch[1].trim();
      }

      // 2. Extract code is the is all the number until first alphabetic character
      const codeMatch = processLine.match(/^\d+/);
      if (codeMatch) {
        processLine = processLine.replace(/^\d+/, '').trim();
        result.products.push({ code: codeMatch[0].trim() });      
      }

     // 3. Extract description that ends with specific patterns
      const descriptionPatterns = [
          '1LT *8',    
          '1 LT *8',   
          '33,5 CL',   
          '30 CL *24', 
          '30 CL*24'   
      ];

      // Create the regex pattern from the static endings
      const endingPattern = descriptionPatterns.map(p => p.replace(/([,./*])/g, '\\$1')).join('|');
      const descriptionMatch = processLine.match(new RegExp(`([A-Z\\s]+(?:${endingPattern}))(?=\\d)`));

        if (descriptionMatch) {
            const description = descriptionMatch[0].trim();
            processLine = processLine.replace(description, '').trim();
            result.products[result.products.length - 1].description = description;
            
        }

      // 4. Extract quantity the number can be with or without decimal
      const quantityMatch = processLine.match(/(\d+(?:\.\d+)?)/);
      if (quantityMatch) {
        processLine = processLine.replace(quantityMatch[0], '').trim();
        result.products[result.products.length - 1].quantity = quantityMatch[0].trim();
      }

      // 5. Extract unit
      const unitMatch = processLine.match(/(Bouteille|CANET|BT\s+(?:100|[23]0))/);
      if (unitMatch) {
        processLine = processLine.replace(unitMatch[0], '').trim();
        result.products[result.products.length - 1].unit = unitMatch[0].trim();
      }

      // 6. Extract unit price
      const unitPriceMatch = processLine.match(/(\d+(?:\.\d{2})?)/);
      if (unitPriceMatch) {
        processLine = processLine.replace(unitPriceMatch[0], '').trim();
        result.products[result.products.length - 1].unit_price = unitPriceMatch[0].trim();
      }

// 7. Extract amount
const amountMatch = processLine.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
if (amountMatch) {
  // Remove the extracted amount from the line
  processLine = processLine.replace(amountMatch[0], '').trim();

  // Replace commas with dots for consistency in the amount
  const amount = amountMatch[0].replace(/,/g, '');
  result.products[result.products.length - 1].amount = amount.trim();
}

      // 8. Extract TVA
      const tvaMatch = processLine.match(/(\d+(?:\.\d{2})?)/);
      if (tvaMatch) {
        processLine = processLine.replace(tvaMatch[0], '').trim();
        
      }
    }
  }
  


  
// Extract total HT
const totalHTMatch = flatText.match(/TOTAL PRIX BRUT\s+([\d,]+\.\d{2})/i);
if (totalHTMatch) {
  result.total_ht = totalHTMatch[1].trim().replace(/\s+/g, '').replace(',', '.');
}

// Extract total TVA
const totalTVAMatch = flatText.match(/TOTAL TVA DÉDUCTIBLE\s+([\d,]+\.\d{2})/i);
if (totalTVAMatch) {
  result.total_tva = totalTVAMatch[1].trim().replace(/\s+/g, '').replace(',', '.');
}

// Extract total TTC
const totalTTMatch = flatText.match(/TOTAL MAD\s+([\d,]+\.\d{2})/i);
result.total_ttc = totalTTMatch?.[1].replace(',', '.') || '';


  return result;
};