"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const authenticate = (req, _res, next) => {
    const authReq = req;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    const [, token] = authHeader.split(' ');
    if (!token) {
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        authReq.user = decoded;
    }
    catch {
        // Ignore bad tokens and continue without auth
    }
    return next();
};
exports.authenticate = authenticate;
const requireAuth = (req, res, next) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    return next();
};
exports.requireAuth = requireAuth;
