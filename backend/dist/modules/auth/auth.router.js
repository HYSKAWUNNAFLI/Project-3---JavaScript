"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const env_1 = require("../../config/env");
const auth_1 = require("../../middleware/auth");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    gradeLevel: zod_1.z.coerce.number().int().min(1).max(5)
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
const buildTokenPayload = (user) => ({
    userId: user.id,
    email: user.email,
    name: user.name,
    gradeLevel: user.gradeLevel
});
const signToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, {
    expiresIn: '7d'
});
router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
    }
    const { email, password, name, gradeLevel } = parsed.data;
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            name,
            gradeLevel,
            passwordHash
        }
    });
    const token = signToken(buildTokenPayload(user));
    return res.status(201).json({ token, user: buildTokenPayload(user) });
});
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
    }
    const { email, password } = parsed.data;
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ message: 'Email or password is incorrect' });
    }
    const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ message: 'Email or password is incorrect' });
    }
    const token = signToken(buildTokenPayload(user));
    return res.json({ token, user: buildTokenPayload(user) });
});
router.get('/me', auth_1.authenticate, auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    return res.json({ user });
});
exports.default = router;
