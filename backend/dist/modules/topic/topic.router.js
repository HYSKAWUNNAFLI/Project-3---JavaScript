"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const gradeLevel = req.query.grade ? Number(req.query.grade) : undefined;
    const where = gradeLevel ? { gradeLevel } : {};
    const topics = await prisma_1.prisma.topic.findMany({
        where,
        orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { questions: true } } }
    });
    res.json({ topics });
});
exports.default = router;
