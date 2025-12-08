import { Router } from 'express';
import { z } from 'zod';
import { AuthRequest, requireAuth } from '../../middleware/auth';
import { prisma } from '../../prisma';

const router = Router();

const querySchema = z.object({
  topicId: z.string().optional(),
  grade: z.coerce.number().int().min(1).max(5).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  limit: z.coerce.number().int().min(1).max(30).optional()
});

const shuffle = <T,>(arr: T[]) => arr.sort(() => Math.random() - 0.5);

router.get('/', requireAuth, async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid query', errors: parsed.error.flatten().fieldErrors });
  }

  const { topicId, grade, difficulty, limit = 10 } = parsed.data;
  const questions = await prisma.question.findMany({
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

export default router;
