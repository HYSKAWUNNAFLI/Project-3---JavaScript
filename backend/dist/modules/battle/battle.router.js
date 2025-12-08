"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
const submitSchema = zod_1.z.object({
    topicId: zod_1.z.string().optional(),
    difficulty: zod_1.z.nativeEnum(client_1.Difficulty),
    answers: zod_1.z
        .array(zod_1.z.object({
        questionId: zod_1.z.string(),
        selectedIndex: zod_1.z.coerce.number().int().nonnegative()
    }))
        .min(1)
});
const randomScore = (total, difficulty) => {
    const ranges = {
        EASY: [0.5, 0.75],
        MEDIUM: [0.6, 0.85],
        HARD: [0.7, 0.95]
    };
    const [min, max] = ranges[difficulty];
    const ratio = min + Math.random() * (max - min);
    return Math.round(total * ratio);
};
router.get('/history', auth_1.requireAuth, async (req, res) => {
    const battles = await prisma_1.prisma.battleMatch.findMany({
        where: { userId: req.user.userId },
        include: { topic: true },
        orderBy: { createdAt: 'desc' },
        take: 15
    });
    res.json({ battles });
});
router.post('/submit', auth_1.requireAuth, async (req, res) => {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten().fieldErrors });
    }
    const { answers, difficulty, topicId } = parsed.data;
    const questionIds = answers.map((a) => a.questionId);
    const questions = await prisma_1.prisma.question.findMany({ where: { id: { in: questionIds } } });
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const userScore = answers.reduce((acc, ans) => {
        const question = questionMap.get(ans.questionId);
        if (!question)
            return acc;
        return acc + (question.answerIndex === ans.selectedIndex ? 1 : 0);
    }, 0);
    const botScore = randomScore(answers.length, difficulty);
    const result = userScore === botScore ? 'DRAW' : userScore > botScore ? 'WIN' : 'LOSS';
    const record = await prisma_1.prisma.battleMatch.create({
        data: {
            userId: req.user.userId,
            topicId: topicId || null,
            difficulty,
            userScore,
            botScore,
            result
        }
    });
    res.json({
        battleId: record.id,
        userScore,
        botScore,
        result
    });
});
exports.default = router;
