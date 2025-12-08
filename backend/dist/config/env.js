"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    port: Number(process.env.PORT) || 4000,
    jwtSecret: process.env.JWT_SECRET || 'change-me',
    nodeEnv: process.env.NODE_ENV || 'development',
    apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
    oauthRedirect: process.env.OAUTH_REDIRECT_URL || 'http://localhost:5173/oauth',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    facebookClientId: process.env.FACEBOOK_CLIENT_ID || '',
    facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET || ''
};
