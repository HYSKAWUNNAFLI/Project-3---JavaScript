"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (_req, res) => {
    const topics = await prisma_1.prisma.learningTopic.findMany({
        orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { questions: true } } }
    });
    res.json({ topics });
});
const paramsSchema = zod_1.z.object({
    id: zod_1.z.string()
});
const querySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(20).optional()
});
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
router.get('/:id/questions', auth_1.requireAuth, async (req, res) => {
    const parsedParams = paramsSchema.safeParse(req.params);
    const parsedQuery = querySchema.safeParse(req.query);
    if (!parsedParams.success || !parsedQuery.success) {
        return res.status(400).json({ message: 'Invalid request' });
    }
    const { id } = parsedParams.data;
    const { limit = 10 } = parsedQuery.data;
    const questions = await prisma_1.prisma.question.findMany({
        where: { learningTopicId: id },
        include: { topic: true, learningTopic: true }
    });
    const randomized = shuffle(questions).slice(0, limit);
    res.json({ questions: randomized });
});
exports.default = router;
