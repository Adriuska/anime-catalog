const app = require('./app');
const connectDB = require('./src/config/db');
const databaseConfig = require('./src/config/database');

const configuredPort = Number(databaseConfig.port);
const envPort = Number(process.env.PORT);
const PORT = configuredPort || envPort || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
