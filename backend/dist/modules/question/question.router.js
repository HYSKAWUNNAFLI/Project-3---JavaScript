"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
const querySchema = zod_1.z.object({
    topicId: zod_1.z.string().optional(),
    grade: zod_1.z.coerce.number().int().min(1).max(5).optional(),
    difficulty: zod_1.z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(30).optional()
});
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
router.get('/', auth_1.requireAuth, async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid query', errors: parsed.error.flatten().fieldErrors });
    }
    const { topicId, grade, difficulty, limit = 10 } = parsed.data;
    const questions = await prisma_1.prisma.question.findMany({
        where: {
            topicId: topicId || undefined,
            difficulty: difficulty ? difficulty : undefined,
            topic: grade ? { gradeLevel: grade } : undefined
        },
        include: { topic: true }
    });
    const randomized = shuffle(questions).slice(0, limit);
    res.json({ questions: randomized });
});
exports.default = router;
