"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const index_js_1 = require("./routes/index.js");
const index_js_2 = require("./config/index.js");
exports.app = (0, express_1.default)();
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({ origin: index_js_2.config.corsOrigin, credentials: true }));
exports.app.use((0, compression_1.default)());
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, morgan_1.default)('dev'));
// Health check
exports.app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
// API Routes
exports.app.use('/api', index_js_1.router);
// Central error handler
exports.app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});
