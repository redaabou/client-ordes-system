const { extractData } = require('../extractData/index');


module.exports = async function (app) {
  app.post('/order', {
    preValidation: [app.authenticate],
    
    handler: async (request, reply) => {
      
      const parts = request.parts();
      let fileBuffer = null;

      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'pdf') {
          fileBuffer = await part.toBuffer();
        }
      }

      if (!fileBuffer) {
        return reply.status(400).send({ message: 'Le fichier PDF est requis.' });
      }
      
      
      const client_name = request.user.client_name;
      
      
      try {
        const extractedData = await extractData(client_name, fileBuffer);

        return reply.status(200).send({
          message: 'Order Data Extracted successfully.',
          data: extractedData
        });
      } catch (error) {
        return reply.status(500).send({
          message: 'Error processing the order.',
          error: error.message
        });
      }
    }
  });
};
