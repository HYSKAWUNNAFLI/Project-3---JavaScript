import { Router } from 'express';
import { prisma } from '../../prisma';

const router = Router();

router.get('/', async (req, res) => {
  const gradeLevel = req.query.grade ? Number(req.query.grade) : undefined;
  const where = gradeLevel ? { gradeLevel } : {};

  const topics = await prisma.topic.findMany({
    where,
    orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { questions: true } } }
  });

  res.json({ topics });
});

export default router;
