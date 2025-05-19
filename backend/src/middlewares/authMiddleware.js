module.exports = function (app) {
    app.decorate('authenticate', async function (request, reply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ message: 'Unauthorized', error: err.message });
      }
    });
  };
  