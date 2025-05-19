const sequelize = require('../../sequelize/config/db'); // Import Sequelize instance
const { QueryTypes } = require('sequelize'); // Import QueryTypes for raw queries

module.exports = async function (app) {
  app.post('/login', async (req, reply) => {
    const { email, password } = req.body;

    try {
      // Use Sequelize to execute a raw query
      const [user] = await sequelize.query('SELECT * FROM public.user WHERE email = ?', {
          replacements: [email],
          type: QueryTypes.SELECT,
        }
      );

      if (!user || user.password !== password) {
        return reply.status(401).send({ message: 'Invalid email or password.' });
      }

      const token = app.jwt.sign(
        { id: user.id, email: user.email, client_name: user.username },
        { expiresIn: '15m' }
      );
      return reply.send({ message: 'Login successful', token });
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ message: 'Server error' });
    }
  });
};