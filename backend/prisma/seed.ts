import { Difficulty, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type DifficultyKey = 'EASY' | 'MEDIUM' | 'HARD';

const learningTopics = [
  'Số tự nhiên & phép tính',
  'Phân số & hỗn số',
  'Số thập phân',
  'Tỉ số - phần trăm',
  'Hình học phẳng cơ bản',
  'Diện tích - thể tích hình khối',
  'Đại lượng đo lường',
  'Biểu thức & thứ tự phép tính',
  'Ứng dụng thực tế',
  'Tư duy logic & suy luận'
];

const buildQuestion = (topicName: string, idx: number, difficulty: DifficultyKey) => {
  const a = 10 + (idx % 50);
  const b = 5 + (idx % 30);
  const op = idx % 4;
  let prompt = '';
  let answer = 0;
  switch (op) {
    case 0:
      prompt = `Tính ${a} + ${b}`;
      answer = a + b;
      break;
    case 1:
      prompt = `Tính ${a + 10} - ${b}`;
      answer = a + 10 - b;
      break;
    case 2:
      prompt = `Tính ${a % 12} × ${b % 9}`;
      answer = (a % 12) * (b % 9);
      break;
    case 3:
      const dividend = (a + b) * 2;
      const divisor = (b % 8) + 2;
      prompt = `Tính ${dividend} ÷ ${divisor}`;
      answer = Math.floor(dividend / divisor);
      break;
  }
  const choices = [answer, answer + 1, answer - 1, answer + 2].map((c) => `${c}`);
  const answerIndex = 0;
  const explanation = `Đáp án đúng vì ${prompt} = ${answer}.`;

  return {
    prompt: `${topicName}: ${prompt}`,
    choices,
    answerIndex,
    difficulty: Difficulty[difficulty],
    explanation
  };
};

async function seed() {
  await prisma.quizAttempt.deleteMany();
  await prisma.battleMatch.deleteMany();
  await prisma.question.deleteMany();
  await prisma.learningTopic.deleteMany();
  await prisma.topic.deleteMany();

  for (const ltName of learningTopics) {
    const topicRecord = await prisma.topic.create({
      data: {
        name: ltName,
        gradeLevel: 5,
        description: ltName
      }
    });

    const learningTopicRecord = await prisma.learningTopic.create({
      data: {
        name: ltName,
        gradeLevel: 5,
        description: ltName
      }
    });

    const questions: {
      prompt: string;
      choices: string[];
      answerIndex: number;
      difficulty: Difficulty;
      explanation: string;
    }[] = [];

    const easyCount = 40;
    const mediumCount = 35;
    const hardCount = 25;

    for (let i = 0; i < easyCount; i++) {
      questions.push(buildQuestion(ltName, i, 'EASY'));
    }
    for (let i = 0; i < mediumCount; i++) {
      questions.push(buildQuestion(ltName, i + easyCount, 'MEDIUM'));
    }
    for (let i = 0; i < hardCount; i++) {
      questions.push(buildQuestion(ltName, i + easyCount + mediumCount, 'HARD'));
    }

    await prisma.question.createMany({
      data: questions.map((q) => ({
        topicId: topicRecord.id,
        learningTopicId: learningTopicRecord.id,
        prompt: q.prompt,
        choices: q.choices,
        answerIndex: q.answerIndex,
        difficulty: q.difficulty,
        explanation: q.explanation
      }))
    });
  }

  console.log('Seeded learning topics with questions (10 topics x 100 câu).');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
