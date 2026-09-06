import mongoose from 'mongoose';
import { app } from './app.js';
import { config } from './config/index.js';

async function bootstrap() {
  try {
    console.log(`Connecting to MongoDB at ${config.mongodbUri}...`);
    try {
      await mongoose.connect(config.mongodbUri);
      console.log('✅ Connected to MongoDB successfully.');
    } catch (dbErr) {
      console.warn('⚠️ MongoDB connection failed (running in offline/dev mock mode):', (dbErr as Error).message);
    }

    app.listen(config.port, () => {
      console.log(`🚀 CarPilot Backend server listening on port ${config.port} (${config.nodeEnv})`);
      console.log(`📡 Healthcheck available at http://localhost:${config.port}/health`);
      console.log(`🤖 AI Provider Layer: ${config.ai.provider.toUpperCase()}`);
    });
  } catch (error) {
    console.error('Fatal Server Startup Failure:', error);
    process.exit(1);
  }
}

bootstrap();
