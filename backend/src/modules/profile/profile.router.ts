import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Buffer } from 'buffer';
import { z } from 'zod';
import { AuthRequest, requireAuth } from '../../middleware/auth';
import { prisma } from '../../prisma';

const router = Router();

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).max(20).optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  avatarBase64: z.string().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6)
});

router.get('/', requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user!;
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) return res.status(404).json({ message: 'User not found' });

  return res.json({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone,
    dateOfBirth: dbUser.dateOfBirth,
    provider: dbUser.provider,
    gradeLevel: dbUser.gradeLevel,
    avatarBase64: dbUser.avatar ? (dbUser.avatar as any).toString('base64') : null
  });
});

router.patch('/', requireAuth, async (req, res) => {
  const auth = (req as AuthRequest).user!;
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
  }

  const data = parsed.data;
  const dbUser = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!dbUser) return res.status(404).json({ message: 'User not found' });

  if (dbUser.provider !== 'LOCAL') {
    delete (data as any).email;
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
  if (data.avatarBase64) {
    try {
      updateData.avatar = Buffer.from(data.avatarBase64 as string, 'base64');
    } catch {
      return res.status(400).json({ message: 'Invalid avatar data' });
    }
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: updateData
  });

  return res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    dateOfBirth: updated.dateOfBirth,
    provider: updated.provider,
    gradeLevel: updated.gradeLevel,
    avatarBase64: updated.avatar ? (updated.avatar as any).toString('base64') : null
  });
});

router.patch('/password', requireAuth, async (req, res) => {
  const auth = (req as AuthRequest).user!;
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
  }
  const { currentPassword, newPassword } = parsed.data;
  const dbUser = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!dbUser) return res.status(404).json({ message: 'User not found' });
  if (dbUser.provider !== 'LOCAL') {
    return res.status(403).json({ message: 'Password change not allowed for OAuth users' });
  }
  const ok = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Current password incorrect' });

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: auth.userId }, data: { passwordHash: newHash } });
  return res.json({ message: 'Password updated' });
});

export default router;
