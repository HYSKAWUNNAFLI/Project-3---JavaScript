import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env';
import { authenticate, AuthPayload, AuthRequest, requireAuth } from '../../middleware/auth';
import { prisma } from '../../prisma';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  gradeLevel: z.coerce.number().int().min(1).max(5)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const buildTokenPayload = (user: { id: string; email: string; name: string; gradeLevel: number }): AuthPayload => ({
  userId: user.id,
  email: user.email,
  name: user.name,
  gradeLevel: user.gradeLevel
});

const signToken = (payload: AuthPayload) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: '7d'
  });

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
  }

  const { email, password, name, gradeLevel } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      gradeLevel,
      passwordHash
    }
  });

  const token = signToken(buildTokenPayload(user));
  return res.status(201).json({ token, user: buildTokenPayload(user) });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }

  const token = signToken(buildTokenPayload(user));
  return res.json({ token, user: buildTokenPayload(user) });
});

router.get('/me', authenticate, requireAuth, async (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

export default router;
