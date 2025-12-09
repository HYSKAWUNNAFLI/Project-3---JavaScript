import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../../middleware/auth';
import { prisma } from '../../prisma';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user!;

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: user.userId },
    select: { responses: true, createdAt: true }
  });

  let total = 0;
  let correct = 0;
  let wrong = 0;

  const perLearningTopic = new Map<
    string,
    { name: string; total: number; correct: number; wrong: number }
  >();

  attempts.forEach((attempt) => {
    const responses = attempt.responses as any[];
    responses.forEach((r) => {
      total += 1;
      if (r?.correct) correct += 1;
      else wrong += 1;

      const ltId = r?.learningTopicId || 'unknown';
      const ltName = r?.learningTopicName || 'Khác';
      if (!perLearningTopic.has(ltId)) {
        perLearningTopic.set(ltId, { name: ltName, total: 0, correct: 0, wrong: 0 });
      }
      const stat = perLearningTopic.get(ltId)!;
      stat.total += 1;
      if (r?.correct) stat.correct += 1;
      else stat.wrong += 1;
    });
  });

  const accuracy = total ? Math.round((correct / total) * 10000) / 100 : 0;

  // streak tính số ngày liên tiếp từ hiện tại ngược lại có làm bài
  const dates = attempts
    .map((a) => new Date(a.createdAt))
    .sort((a, b) => b.getTime() - a.getTime())
    .map((d) => d.toISOString().slice(0, 10));
  let streak = 0;
  let cur = new Date();
  cur.setHours(0, 0, 0, 0);
  const seen = new Set(dates);
  while (seen.has(cur.toISOString().slice(0, 10))) {
    streak += 1;
    cur.setDate(cur.getDate() - 1);
  }

  const topicBreakdown = Array.from(perLearningTopic.entries())
    .filter(([id]) => id !== 'unknown')
    .map(([id, s]) => ({
      learningTopicId: id,
      learningTopicName: s.name,
      correct: s.correct,
      wrong: s.wrong,
      total: s.total,
      correctRate: s.total ? Math.round((s.correct / s.total) * 10000) / 100 : 0,
      wrongRate: s.total ? Math.round((s.wrong / s.total) * 10000) / 100 : 0
    }))
    .sort((a, b) => b.correctRate - a.correctRate);

  return res.json({
    total,
    correct,
    wrong,
    accuracy,
    completed: correct,
    incomplete: wrong,
    streakDays: streak,
    topicBreakdown
  });
});

export default router;
