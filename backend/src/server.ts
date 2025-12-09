import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { authenticate } from './middleware/auth';
import authRouter from './modules/auth/auth.router';
import oauthRouter from './modules/auth/oauth.router';
import battleRouter from './modules/battle/battle.router';
import questionRouter from './modules/question/question.router';
import quizRouter from './modules/quiz/quiz.router';
import topicRouter from './modules/topic/topic.router';
import learningRouter from './modules/learning/learning.router';
import statsRouter from './modules/stats/stats.router';
import profileRouter from './modules/profile/profile.router';
import passport from 'passport';

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(authenticate);

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mathkid-backend',
    docs: [
      '/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/topics',
      '/api/questions',
      '/api/quiz',
      '/api/battle'
    ]
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mathkid-backend' });
});

// Silence Chrome devtools /.well-known probe noise
// Silence Chrome devtools /.well-known probe noise
app.get(/^\/\.well-known\/.*$/, (_req, res) => {
  res.status(204).end();
});

app.use('/api/auth', authRouter);
app.use('/api/auth/oauth', oauthRouter);
app.use('/api/topics', topicRouter);
app.use('/api/questions', questionRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/battle', battleRouter);
app.use('/api/learning-topics', learningRouter);
app.use('/api/stats', statsRouter);
app.use('/api/profile', profileRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`MathKid API is running on http://localhost:${env.port}`);
});
