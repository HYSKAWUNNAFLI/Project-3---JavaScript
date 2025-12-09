"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const buffer_1 = require("buffer");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
const profileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(6).max(20).optional(),
    dateOfBirth: zod_1.z.string().optional(), // ISO date
    avatarBase64: zod_1.z.string().optional()
});
const passwordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6),
    newPassword: zod_1.z.string().min(6)
});
router.get('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const dbUser = await prisma_1.prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser)
        return res.status(404).json({ message: 'User not found' });
    return res.json({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        dateOfBirth: dbUser.dateOfBirth,
        provider: dbUser.provider,
        gradeLevel: dbUser.gradeLevel,
        avatarBase64: dbUser.avatar ? dbUser.avatar.toString('base64') : null
    });
});
router.patch('/', auth_1.requireAuth, async (req, res) => {
    const auth = req.user;
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
    }
    const data = parsed.data;
    const dbUser = await prisma_1.prisma.user.findUnique({ where: { id: auth.userId } });
    if (!dbUser)
        return res.status(404).json({ message: 'User not found' });
    if (dbUser.provider !== 'LOCAL') {
        // For OAuth users, disallow email change
        delete data.email;
    }
    const updateData = {};
    if (data.name)
        updateData.name = data.name;
    if (data.email)
        updateData.email = data.email;
    if (data.phone !== undefined)
        updateData.phone = data.phone;
    if (data.dateOfBirth)
        updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.avatarBase64) {
        try {
            const buf = buffer_1.Buffer.from(data.avatarBase64, 'base64');
            updateData.avatar = buf;
        }
        catch {
            return res.status(400).json({ message: 'Invalid avatar data' });
        }
    }
    const updated = await prisma_1.prisma.user.update({
        where: { id: auth.userId },
        data: updateData
    });
    return res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        dateOfBirth: updated.dateOfBirth,
        provider: updated.provider,
        gradeLevel: updated.gradeLevel,
        avatarBase64: updated.avatar ? updated.avatar.toString('base64') : null
    });
});
router.patch('/password', auth_1.requireAuth, async (req, res) => {
    const auth = req.user;
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
    }
    const { currentPassword, newPassword } = parsed.data;
    const dbUser = await prisma_1.prisma.user.findUnique({ where: { id: auth.userId } });
    if (!dbUser)
        return res.status(404).json({ message: 'User not found' });
    if (dbUser.provider !== 'LOCAL') {
        return res.status(403).json({ message: 'Password change not allowed for OAuth users' });
    }
    const ok = await bcryptjs_1.default.compare(currentPassword, dbUser.passwordHash);
    if (!ok)
        return res.status(401).json({ message: 'Current password incorrect' });
    const newHash = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.prisma.user.update({ where: { id: auth.userId }, data: { passwordHash: newHash } });
    return res.json({ message: 'Password updated' });
});
exports.default = router;
