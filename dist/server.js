"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_js_1 = require("./app.js");
const index_js_1 = require("./config/index.js");
async function bootstrap() {
    try {
        console.log(`Connecting to MongoDB at ${index_js_1.config.mongodbUri}...`);
        try {
            await mongoose_1.default.connect(index_js_1.config.mongodbUri);
            console.log('✅ Connected to MongoDB successfully.');
        }
        catch (dbErr) {
            console.warn('⚠️ MongoDB connection failed (running in offline/dev mock mode):', dbErr.message);
        }
        app_js_1.app.listen(index_js_1.config.port, () => {
            console.log(`🚀 CarPilot Backend server listening on port ${index_js_1.config.port} (${index_js_1.config.nodeEnv})`);
            console.log(`📡 Healthcheck available at http://localhost:${index_js_1.config.port}/health`);
            console.log(`🤖 AI Provider Layer: ${index_js_1.config.ai.provider.toUpperCase()}`);
        });
    }
    catch (error) {
        console.error('Fatal Server Startup Failure:', error);
        process.exit(1);
    }
}
bootstrap();
