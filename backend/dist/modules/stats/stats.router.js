"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const attempts = await prisma_1.prisma.quizAttempt.findMany({
        where: { userId: user.userId },
        select: { responses: true }
    });
    let total = 0;
    let correct = 0;
    let wrong = 0;
    attempts.forEach((attempt) => {
        const responses = attempt.responses;
        responses.forEach((r) => {
            total += 1;
            if (r?.correct)
                correct += 1;
            else
                wrong += 1;
        });
    });
    const accuracy = total ? Math.round((correct / total) * 10000) / 100 : 0;
    return res.json({
        total,
        correct,
        wrong,
        accuracy,
        completed: correct,
        incomplete: wrong
    });
});
exports.default = router;
