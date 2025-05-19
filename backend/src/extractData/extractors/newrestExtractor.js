const pdf = require("pdf-parse");

function normalize(str) {
  return str.replace(/\s+/g, " ").trim();
}

module.exports = async function extractFromPaul(buffer) {
  const { text } = await pdf(buffer);

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

  // 1. Extract Order Number
  const orderNumberMatch = text.match(/PURCHASE ORDER No (\d+)/i);
  if (orderNumberMatch) {
    result.order_number = orderNumberMatch[1];
  }

  // 2. Extract Date
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/i);
  if (dateMatch) {
    result.order_date = dateMatch[1];
  } else {
    const dateMatch2 = text.match(/(\d{4}-\d{2}-\d{2})/i);
    if (dateMatch2) {
      result.order_date = dateMatch2[1];
    }
  }

  // 3. Extract Delivery Address
  const addressMatch = text.match(
    /CMN_ECONOMAT_NMI[\s\S]*?ECONOMAT([\s\S]*?)Supplier :/i
  );
  if (addressMatch) {
    result.delivery_address = addressMatch[1]
      .replace(/\n/g, " ")
      .replace(/_NMI/g, "")
      .replace(/HeadOffice.*$/, "")
      .trim();
  }

  // 4. Extract Responsible Person (fallback to placeholder if not found)
  const responsableMatch = text.match(/Approved by\s*(.*)/i);
  if (responsableMatch) {
    result.sales_manager = responsableMatch[1].trim();
  }

  // 5. Extract Products
  const productSectionMatch = text.match(
    /BOISSONS FROIDES([\s\S]+?)CodeTax-free Basis/i
  );
  

  if (productSectionMatch) {
    const productSection = productSectionMatch[1].trim();
    

    // Split the product section into lines and normalize them
    const lines = productSection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    
    // Merge related lines into a single line for each product
    const mergedLines = [];
    let currentLine = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if the line starts a new product (e.g., contains a description with "cl" or "Can")
      if (line.match(/cl|Can|Pet|CANS/i)) {
        // If there's an existing product line, push it to mergedLines
        if (currentLine) {
          mergedLines.push(currentLine.trim());
          currentLine = "";
          
        }
        currentLine = line; // Start a new product line
      } else if (line.match(/BOISSONS\s+[A-Z]+/i)) {
        // If the line indicates a new section (e.g., "BOISSONS GAZEUSES"), finalize the current product
        if (currentLine) {
          mergedLines.push(currentLine.trim());
          currentLine = "";
        }
        // Skip the section header
      } else {
        // Otherwise, append the line to the current product
        currentLine += ` ${line}`;
      }
    }

    // Push the last product line if it exists (outside the loop)
    if (currentLine) {
      mergedLines.push(currentLine.trim());
    }

    // Parse each merged product line
    for (const line of mergedLines) {
      // Hawai Ananas /25cl/Can10 CARTON 18 UNITE (1 U) 3,7367,19134,38671,920 %

      // Extract description (everything including "Pet", "Can", or "CANS")
      const descriptionMatch = line.match(/^(.*?(?:Pet|Can|CANS))/i);
      const description = descriptionMatch ? descriptionMatch[1].trim() : "";

      //  the number between description and CARTON OR PACK is the quantity
      const quantityMatch = line.match(/(\d+)\s+(?:CARTON|PACK)/i);
      const extractedquantity = quantityMatch ? quantityMatch[1] : "";

      // number of packs is the number between CARTON Or PACK and UNITE
      const packsMatch = line.match(/(?:CARTON|PACK)\s+(\d+)\s+UNITE/i);
      const extractedPacks = packsMatch ? packsMatch[1] : "";

      // Extract unit_price (the first number after "(1 U)")
      const unit_priceMatch = line.match(/\(1 U\)\s+(\d+,\d{2})/i);
      let unit_price = unit_priceMatch ? unit_priceMatch[1] : "";

      // calculate pack_price = unit_price * packs
      let pack_price = "";
      if (unit_price && extractedPacks) {
        // Convert to float and calculate
        const unit_priceFloat = parseFloat(unit_price.replace(",", "."));
        const packsFloat = parseFloat(extractedPacks.replace(",", "."));
        pack_price = (unit_priceFloat * packsFloat)
          .toFixed(2)
          .replace(".", ",");
      }

      // calculate amount = unit_price * quantity * packs
      let amount = "";
      if (unit_price && extractedquantity && extractedPacks) {
        // Convert to float and calculate
        const unit_priceFloat = parseFloat(unit_price.replace(",", "."));
        const quantityFloat = parseFloat(extractedquantity.replace(",", "."));
        const packsFloat = parseFloat(extractedPacks.replace(",", "."));
        amount = (unit_priceFloat * quantityFloat * packsFloat)
          .toFixed(2)
          .replace(".", ",");
      }

      // Add the product to the result
      if (
        description &&
        extractedquantity &&
        extractedPacks &&
        unit_price &&
        amount
      ) {
        result.products.push({
          description: normalize(description),
          quantity: normalize(extractedquantity),
          packs: normalize(extractedPacks),
          pack_price: normalize(pack_price),
          unit_price: normalize(unit_price),
          amount: normalize(amount),
        });
      } else {
        console.log("Failed to extract product details from line:", line);
      }
    }
  }

  // 6. Extract Totals
  const total_htMatch = text.match(/Excl tax TOTALMAD\s*([\d.,]+)/i);
  if (total_htMatch) {
    result.total_ht = total_htMatch[1].replace(/\./g, "").replace(",", ".");
  }

  const total_tvaMatch = text.match(/Total 20%MAD\s*([\d.,]+)/i);
  if (total_tvaMatch) {
    result.total_tva = total_tvaMatch[1].replace(/\./g, "").replace(",", ".");
  }

  const total_ttcMatch = text.match(/Incl tax TOTALMAD\s*([\d.,]+)/i);
  if (total_ttcMatch) {
    result.total_ttc = total_ttcMatch[1].replace(/\./g, "").replace(",", ".");
  }

  // // Format the result
  // const formattedResult = {
  //   orders: [
  //     {
  //       delivery_address: result.delivery_address,
  //       sales_manager: result.sales_manager,
  //       order_number: result.order_number,
  //       order_date: result.order_date,
  //       products: result.products,
  //       total_ht: result.total_ht,
  //       total_tva: result.total_tva,
  //       total_ttc: result.total_ttc,
  //     },
  //   ],
  // };

  return result;
};
