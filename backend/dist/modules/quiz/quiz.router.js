"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
const submitSchema = zod_1.z.object({
    mode: zod_1.z.nativeEnum(client_1.AttemptMode),
    topicId: zod_1.z.string().optional(),
    answers: zod_1.z
        .array(zod_1.z.object({
        questionId: zod_1.z.string(),
        selectedIndex: zod_1.z.coerce.number().int().nonnegative()
    }))
        .min(1)
});
router.get('/attempts', auth_1.requireAuth, async (req, res) => {
    const attempts = await prisma_1.prisma.quizAttempt.findMany({
        where: { userId: req.user.userId },
        include: { topic: true },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    res.json({ attempts });
});
router.post('/submit', auth_1.requireAuth, async (req, res) => {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten().fieldErrors });
    }
    const { mode, topicId, answers } = parsed.data;
    const questionIds = answers.map((a) => a.questionId);
    const questions = await prisma_1.prisma.question.findMany({
        where: { id: { in: questionIds } },
        include: { topic: true }
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let score = 0;
    const details = answers.map((answer) => {
        const question = questionMap.get(answer.questionId);
        if (!question) {
            return { ...answer, correct: false, correctIndex: null, topicId: null, topicName: null };
        }
        const correct = question.answerIndex === answer.selectedIndex;
        if (correct)
            score += 1;
        return {
            ...answer,
            correct,
            correctIndex: question.answerIndex,
            topicId: question.topicId,
            topicName: question.topic.name
        };
    });
    const perTopic = new Map();
    details.forEach((d) => {
        if (!d.topicId || !d.topicName)
            return;
        if (!perTopic.has(d.topicId)) {
            const topic = questionMap.get(d.questionId)?.topic;
            perTopic.set(d.topicId, {
                topicName: d.topicName,
                gradeLevel: topic?.gradeLevel ?? 1,
                total: 0,
                correct: 0
            });
        }
        const stats = perTopic.get(d.topicId);
        stats.total += 1;
        stats.correct += d.correct ? 1 : 0;
    });
    const strengths = Array.from(perTopic.entries())
        .map(([topicId, stats]) => ({
        topicId,
        topicName: stats.topicName,
        gradeLevel: stats.gradeLevel,
        accuracy: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
    }))
        .sort((a, b) => b.accuracy - a.accuracy);
    const weaknesses = strengths.filter((s) => s.accuracy < 70);
    const attempt = await prisma_1.prisma.quizAttempt.create({
        data: {
            userId: req.user.userId,
            topicId: topicId || null,
            mode,
            score,
            totalQuestions: answers.length,
            responses: details
        }
    });
    res.json({
        attemptId: attempt.id,
        score,
        totalQuestions: answers.length,
        strengths,
        weaknesses
    });
});
exports.default = router;
