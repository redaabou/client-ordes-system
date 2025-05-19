const pdf = require("pdf-parse");

function normalize(str) {
  return str.replace(/\s+/g, " ").trim();
}

module.exports = async function extractFromClientCbgs(buffer) {
  const { text } = await pdf(buffer);
  // console.log('Extracting data from client ...', text );

  const flatText = text.replace(/\n\s+/g, " ").replace(/\s+/g, " ").trim();
  // console.log("Extracting data from client ...", flatText);
  

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
  const bonDeCommandeMatch = flatText.match(/N°:\s*(\d+)/);
  if (bonDeCommandeMatch) {
    result.order_number = bonDeCommandeMatch[1].trim();
  }

  // Extract order date
  const dateMatch = flatText.match(
    /(?:le|Date de Livraison\s*:\s*|Livraison\s*[:\-]?)\s*(?:lun\.|sam\.)?\s*(\d{1,2})\s*(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s*(\d{2})/i
  );
  if (dateMatch) {
    const months = {
      janv: "01",
      févr: "02",
      mars: "03",
      avr: "04",
      mai: "05",
      juin: "06",
      juil: "07",
      août: "08",
      sept: "09",
      oct: "10",
      nov: "11",
      déc: "12",
    };
    const day = dateMatch[1].padStart(2, "0");
    const month = months[dateMatch[2].toLowerCase()];
    const year = "20" + dateMatch[3]; // Assume 20XX
    result.order_date = `${day}.${month}.${year}`;
  }

  // Extract Adresse de livraison
  const adresseMatch = flatText.match(/Lieu de livraison :(.+?)(?=_{20})/);
  if (adresseMatch) {
    result.delivery_address = adresseMatch ? normalize(adresseMatch[1]) : "";
  }

  // Extract Date de livraison from text Date de Livraison : lun. 16déc.24
  const dateLivraisonMatch = text.match(
    /Date de Livraison\s*:\s*(?:lun\.|sam\.)?\s*(\d{1,2})\s*(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s*(\d{2})/i
  );
  if (dateLivraisonMatch) {
    const months = {
      janv: "01",
      févr: "02",
      mars: "03",
      avr: "04",
      mai: "05",
      juin: "06",
      juil: "07",
      août: "08",
      sept: "09",
      oct: "10",
      nov: "11",
      déc: "12",
    };
    const day = dateLivraisonMatch[1].padStart(2, "0");
    const month = months[dateLivraisonMatch[2].toLowerCase()];
    const year = "20" + dateLivraisonMatch[3]; // Assume 20XX
    result.delivery_date = `${day}.${month}.${year}`;
  }

  // Extract Responsable achat
  const responsableMatch = flatText.match(/Qui : (.+?)(?=\s*Page|$)/);
  if (responsableMatch) {
    result.sales_manager = responsableMatch[1].trim();
  }

  // 5. Extract Products
  const productBlockMatch = text.match(/NameQty2Qty1PackName[\s\S]+?Taxes/i);
  const productBlock = productBlockMatch ? productBlockMatch[0] : "";
  // remove the first line and the last line
  const productBlockLines = productBlock.split("\n").slice(1, -1).join("\n");

  // Split the block into lines
  const rawLines = productBlockLines.split("\n");

  // Loop through each line
  rawLines.forEach((line) => {
    // Remove any extra spaces and trim the line
    let processLine = line.trim();

    // Create an object to store the extracted values
    const product = {};

    // 1. Extract description (including size specification)
    const descriptionMatch = processLine.match(
      /^([A-Z\s]+(?:(?:1L|33CL|33C|33|35|30(?:\s+CL)?|VERR|30\s+CL)?))/
    );
    if (descriptionMatch) {
      product.description = descriptionMatch[1].trim();
      processLine = processLine.substring(descriptionMatch[0].length).replace(/^\s+/, "");
      // console.log("the line after deleting the description", processLine);
    }

    // 2. Extract quantity and packaging type (if present)
    const quantityMatch = processLine.match(
      /^(\d+)(CAISSE 24|CARTON 8|CARTON 24)/
    );
    
    
    if (quantityMatch) {
      product.quantity = quantityMatch[1];
      product.packaging = quantityMatch[2];
      processLine = processLine.substring(quantityMatch[0].length);
      // console.log(
      //   "the line after deleteing the quantity and packaging",
      //   processLine
      // );
    }

    // 3. Extract pack price
    const priceMatch = processLine.match(/\s*(\d+\.\d{2})/);
    if (priceMatch) {
      product.pack_price = priceMatch[1];
      processLine = processLine.substring(
        priceMatch.index + priceMatch[0].length
      );
      // console.log("the line after deleting the pack price", processLine);
    }

    // 4. Extract unit type and unit price
    const unitMatch = processLine.match(
      /(CANET|BT\s*(?:100|[23]0))\s*(\d+\.\d{3})/
    );
    if (unitMatch) {
      console.log("unitMatch", unitMatch);
      product.unit = unitMatch[1];
      product.unit_price = unitMatch[2];
      processLine = processLine.substring(
        unitMatch.index + unitMatch[0].length
      );
      // console.log(
      //   "the line after deleting the unit type and unit price",
      //   processLine
      // );
    }

    // 5. Extract final amount (handle both formats: x,xxx.xx and xxx.xx)
    const amountMatch = processLine.match(/(?:\d+,)?(\d+\.\d{2})/);
    if (amountMatch) {
      product.amount = amountMatch[0]; // Use the full match to preserve the comma
    }

    // console.log("Extracted Product:", product);

        result.products.push({
          code: product.code || "",
          description:product.description || "",
          category: product.category || "",
          packaging: product.packaging || "",
          quantity: product.quantity || "",
          size: product.size || "",
          unit: product.unit || "",
          unit_price: product.unit_price || "",
          pack_price: product.pack_price || "",
          discount: product.discount || "",
          amount: product.amount || "",
        });
  });



  // Extract total HT
  const totalHTMatch = flatText.match(/SubTot(\d+\.\d{2})/);
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
