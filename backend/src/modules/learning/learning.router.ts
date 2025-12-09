import { AttemptMode, Difficulty } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../../middleware/auth';
import { prisma } from '../../prisma';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const topics = await prisma.learningTopic.findMany({
    orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { questions: true } } }
  });
  res.json({ topics });
});

const paramsSchema = z.object({
  id: z.string()
});

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional()
});

const shuffle = <T,>(arr: T[]) => arr.sort(() => Math.random() - 0.5);

router.get('/:id/questions', requireAuth, async (req, res) => {
  const parsedParams = paramsSchema.safeParse(req.params);
  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedParams.success || !parsedQuery.success) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  const { id } = parsedParams.data;
  const { limit = 10 } = parsedQuery.data;

  const questions = await prisma.question.findMany({
    where: { learningTopicId: id },
    include: { topic: true, learningTopic: true }
  });

  const randomized = shuffle(questions).slice(0, limit);
  res.json({ questions: randomized });
});

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        selectedIndex: z.coerce.number().int().nonnegative()
      })
    )
    .min(1)
});

router.post('/:id/submit', requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user!;
  const parsedParams = paramsSchema.safeParse(req.params);
  const parsedBody = submitSchema.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  const { id } = parsedParams.data;
  const { answers } = parsedBody.data;

  const questions = await prisma.question.findMany({
    where: { id: { in: answers.map((a) => a.questionId) } },
    include: { topic: true, learningTopic: true }
  });
  const qMap = new Map(questions.map((q) => [q.id, q]));

  let score = 0;
  const responses = answers.map((a) => {
    const q = qMap.get(a.questionId);
    const correct = q ? q.answerIndex === a.selectedIndex : false;
    if (correct) score += 1;
    return {
      ...a,
      correct,
      correctIndex: q?.answerIndex ?? null,
      topicId: q?.topicId ?? null,
      topicName: q?.topic?.name ?? null,
      learningTopicId: q?.learningTopicId ?? null,
      learningTopicName: q?.learningTopic?.name ?? null
    };
  });

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.userId,
      topicId: null,
      mode: AttemptMode.PRACTICE,
      score,
      totalQuestions: answers.length,
      responses
    }
  });

  res.json({
    attemptId: attempt.id,
    score,
    totalQuestions: answers.length,
    accuracy: answers.length ? Math.round((score / answers.length) * 10000) / 100 : 0
  });
});

export default router;
