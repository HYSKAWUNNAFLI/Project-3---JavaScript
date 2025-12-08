import { Router } from 'express';
import { BattleResult, Difficulty } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, requireAuth } from '../../middleware/auth';
import { prisma } from '../../prisma';

const router = Router();

const submitSchema = z.object({
  topicId: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        selectedIndex: z.coerce.number().int().nonnegative()
      })
    )
    .min(1)
});

const randomScore = (total: number, difficulty: Difficulty) => {
  const ranges: Record<Difficulty, [number, number]> = {
    EASY: [0.5, 0.75],
    MEDIUM: [0.6, 0.85],
    HARD: [0.7, 0.95]
  };
  const [min, max] = ranges[difficulty];
  const ratio = min + Math.random() * (max - min);
  return Math.round(total * ratio);
};

router.get('/history', requireAuth, async (req: AuthRequest, res) => {
  const battles = await prisma.battleMatch.findMany({
    where: { userId: req.user!.userId },
    include: { topic: true },
    orderBy: { createdAt: 'desc' },
    take: 15
  });
  res.json({ battles });
});

router.post('/submit', requireAuth, async (req: AuthRequest, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten().fieldErrors });
  }

  const { answers, difficulty, topicId } = parsed.data;
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const userScore = answers.reduce((acc, ans) => {
    const question = questionMap.get(ans.questionId);
    if (!question) return acc;
    return acc + (question.answerIndex === ans.selectedIndex ? 1 : 0);
  }, 0);

  const botScore = randomScore(answers.length, difficulty);
  const result: BattleResult =
    userScore === botScore ? 'DRAW' : userScore > botScore ? 'WIN' : 'LOSS';

  const record = await prisma.battleMatch.create({
    data: {
      userId: req.user!.userId,
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

export default router;
