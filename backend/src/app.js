const Fastify = require('fastify');
const jwt = require('fastify-jwt');
const multipart = require('@fastify/multipart');
const cors = require('@fastify/cors');
require('dotenv').config();


const app = Fastify();


app.register(jwt, { secret: process.env.JWT_SECRET });
app.register(multipart);


app.register(cors, {
  origin: 'http://localhost:5173',
});


require('../src/middlewares/authMiddleware')(app);


app.register(require('./routes/login'));
app.register(require('./routes/order'));


app.listen({ port: 3000 }, () => {
  console.log('Server running on http://localhost:3000');
});
