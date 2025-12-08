"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const auth_1 = require("./middleware/auth");
const auth_router_1 = __importDefault(require("./modules/auth/auth.router"));
const oauth_router_1 = __importDefault(require("./modules/auth/oauth.router"));
const battle_router_1 = __importDefault(require("./modules/battle/battle.router"));
const question_router_1 = __importDefault(require("./modules/question/question.router"));
const quiz_router_1 = __importDefault(require("./modules/quiz/quiz.router"));
const topic_router_1 = __importDefault(require("./modules/topic/topic.router"));
const passport_1 = __importDefault(require("passport"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
app.use(auth_1.authenticate);
app.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'mathkid-backend',
        docs: [
            '/health',
            '/api/auth/register',
            '/api/auth/login',
            '/api/topics',
            '/api/questions',
            '/api/quiz',
            '/api/battle'
        ]
    });
});
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mathkid-backend' });
});
// Silence Chrome devtools /.well-known probe noise
// Silence Chrome devtools /.well-known probe noise
app.get(/^\/\.well-known\/.*$/, (_req, res) => {
    res.status(204).end();
});
app.use('/api/auth', auth_router_1.default);
app.use('/api/auth/oauth', oauth_router_1.default);
app.use('/api/topics', topic_router_1.default);
app.use('/api/questions', question_router_1.default);
app.use('/api/quiz', quiz_router_1.default);
app.use('/api/battle', battle_router_1.default);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});
app.listen(env_1.env.port, () => {
    console.log(`MathKid API is running on http://localhost:${env_1.env.port}`);
});
