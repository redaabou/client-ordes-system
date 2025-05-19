const pdf = require('pdf-parse');

module.exports = async function extractRezoroute(buffer) {
  const { text } = await pdf(buffer);
  
  const result = { orders: [] };

  // Split text into orders using the order number pattern
  const orderSections = text.split(/(?=Numéro de Bon de CommandeP\d+)/gi);
  console.log('Extracting data from rezoroute ...', orderSections);
  

  orderSections.forEach((section, sectionIndex) => {
    if (!section.trim()) return; // Skip empty sections
    
    const order = {
      delivery_address: '',
      sales_manager: '',
      order_number: '',
      order_date: '',
      products: [],
      total_ht: "",
      total_tva: "",
      total_ttc: "",
    };

    // 1. Extract Order Number
    const orderNumberMatch = section.match(/Numéro de Bon de Commande(P\d+)/);
    if (orderNumberMatch) {
      order.order_number = orderNumberMatch[1];
      // console.log(`Found order number: ${order.order_number}`);
    }

    // 2. Extract Address (including city)
    const addressMatch = section.match(/Adresse de livraison :\s*([\s\S]*?)(?=ATLAS BOTTLING COMPANY|Responsable achat:|$)/i);
    if (addressMatch) {
      const addressText = addressMatch[1].trim();
      const addressLines = addressText.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.match(/^Maroc$/i));
      
      if (addressLines.length > 0) {
        // Combine all address lines into a single address
        order.delivery_address = addressLines.join(', ');
        // console.log(`Found address: "${order.delivery_address}"`);
      }
    }

    // 3. Extract Purchasing Manager
    const responsableMatch = section.match(/Responsable achat:\s*([^\n]+)/i);
    if (responsableMatch) {
      order.sales_manager = responsableMatch[1].trim();
      // console.log(`Found manager: ${order.sales_manager}`);
    }

    // 4. Extract Order Date
    const dateMatch = section.match(/Date de commande :\s*(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/);
    if (dateMatch) {
      order.order_date = dateMatch[1];
      // console.log(`Found date: ${order.order_date}`);
    }

    // 5. COMPLETELY REVISED: Extract Products with precise pattern matching 
    const lines = section.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (
        trimmedLine.startsWith('[') &&
        trimmedLine.includes('TVA') &&
        trimmedLine.includes('ACHATS') &&
        trimmedLine.includes('DH')
      ) {
        
        // 1. Extract product code
        const codeMatch = trimmedLine.match(/^\[([A-Z0-9]+)\]/);
        const descMatch = trimmedLine.match(/^\[[A-Z0-9]+\]\s+(.*?)TVA/);

        if (!codeMatch || !descMatch) {
          continue;
        }

        const code = codeMatch[1];
        const description = descMatch[1].trim();

        // 2. Get the numeric block after "ACHATS"
        const parts = trimmedLine.split('ACHATS');
        if (parts.length < 2) {
          continue;
        }

        const numericBlock = parts[1].replace('DH', '').trim();

        // 3. Identify quantity to separate barcode
        const quantityMatch = numericBlock.match(/(\d{2},\d{3})/);
        if (!quantityMatch) {
          continue;
        }

        const quantityStr = quantityMatch[1];
        const quantityIndex = numericBlock.indexOf(quantityStr);
        const barcode = numericBlock.slice(0, quantityIndex).trim();
        const rest = numericBlock.slice(quantityIndex).trim();

        // 4. Extract the 4 numbers (quantity, unit price, remise, montant) even if glued
        const numberMatch = rest.match(/(\d{2},\d{3})(\d+,\d{2})(\d+,\d{2})(\d+,\d{2})/);

        if (!numberMatch) {
          continue;
        }

        const [, quantiteStr, prixStr, remiseStr, montantStr] = numberMatch;

        // 5. Format and push
        const parse = (s) => parseFloat(s.replace(',', '.'));

        const product = {
          code,
          description,
          codeBarre: barcode,
          quantity: parse(quantiteStr).toFixed(3),
          unit_price: parse(prixStr).toFixed(2),
          discount: parse(remiseStr).toFixed(2),
          amount: parse(montantStr).toFixed(2)
        };
        order.products.push(product);
      }
    }



        if (order.order_number) {
          result.orders.push(order);
        }


      // Extract total HT
      const totalHTMatch = section.match(/Sous-total\s*([\d\s,]+)\s*DH/i);
      if (totalHTMatch) {
        order.total_ht = totalHTMatch[1]
          .trim()
          .replace(/\s+/g, "")
          .replace(/,/g, '.');
      }

      // Extract total TVA is in the line 'Taxes245,94 DH\n'
      const totalTVAMatch = section.match(/Taxes\s*([\d\s,]+)\s*DH/i);
      if (totalTVAMatch) {
        order.total_tva = totalTVAMatch[1]
          .trim()
          .replace(/\s+/g, "")
          .replace(/,/g, '.');
      }

      // Extract total TTC (Total at the start of the line)
      const totalTTMatch = section.match(/^Total\s*([\d\s,]+)\s*DH/im);
      if (totalTTMatch) {
        order.total_ttc = totalTTMatch[1]
          .trim()
          .replace(/\s+/g, "")
          .replace(/,/g, '.');
      }



  });





  return result;
}