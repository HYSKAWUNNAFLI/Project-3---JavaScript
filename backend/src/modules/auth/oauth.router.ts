import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../prisma';

const router = Router();

const buildPayload = (user: { id: string; email: string; name: string; gradeLevel: number }) => ({
  userId: user.id,
  email: user.email,
  name: user.name,
  gradeLevel: user.gradeLevel
});

const signToken = (payload: ReturnType<typeof buildPayload>) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });

const redirectWithToken = (res: any, token: string, error?: string) => {
  const url = new URL(env.oauthRedirect);
  if (error) url.searchParams.set('error', error);
  url.searchParams.set('token', token);
  return res.redirect(url.toString());
};

router.get('/config', (_req, res) => {
  res.json({
    googleEnabled: Boolean(env.googleClientId && env.googleClientSecret),
    facebookEnabled: false // not implemented now
  });
});

if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: `${env.apiBaseUrl}/api/auth/oauth/google/callback`
      },
      async (_access: string, _refresh: string, profile: any, done: (err?: any, user?: any) => void) => {
        try {
          const email = profile.emails?.[0]?.value;
          const providerId = profile.id;
          const name = profile.displayName || email || 'Google User';

          if (!email) return done(new Error('Email not provided by Google'));

          let user = await prisma.user.findFirst({
            where: { OR: [{ providerId }, { email }] }
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name,
                gradeLevel: 5,
                passwordHash: '',
                provider: 'GOOGLE',
                providerId
              }
            });
          } else if (!user.providerId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { providerId, provider: 'GOOGLE' }
            });
          }

          return done(null, user);
        } catch (e) {
          return done(e as Error);
        }
      }
    )
  );
}

router.get('/google', (req, res, next) => {
  if (!env.googleClientId || !env.googleClientSecret) {
    return res.status(503).json({ message: 'Google OAuth not configured' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: env.oauthRedirect }),
  (req: any, res) => {
    const user = req.user as any;
    const token = signToken(buildPayload(user));
    return redirectWithToken(res, token);
  }
);

export default router;
