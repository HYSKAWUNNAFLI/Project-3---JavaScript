import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile as GoogleProfile, type VerifyCallback as GoogleVerifyCb } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, type Profile as FacebookProfile, type VerifyFunction as FacebookVerifyFn } from 'passport-facebook';
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

// Google strategy
if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: `${env.apiBaseUrl}/api/auth/oauth/google/callback`
      },
      async (_access: string, _refresh: string, profile: GoogleProfile, done: GoogleVerifyCb) => {
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
                gradeLevel: 1,
                passwordHash: '',
                provider: 'GOOGLE',
                providerId
              }
            });
          } else if (!user.providerId) {
            // link providerId for existing email login
            await prisma.user.update({
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

// Facebook strategy
if (env.facebookClientId && env.facebookClientSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: env.facebookClientId,
        clientSecret: env.facebookClientSecret,
        callbackURL: `${env.apiBaseUrl}/api/auth/oauth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails']
      },
      async (_access: string, _refresh: string, profile: FacebookProfile, done: FacebookVerifyFn) => {
        try {
          const email = profile.emails?.[0]?.value;
          const providerId = profile.id;
          const name = profile.displayName || email || 'Facebook User';

          if (!email) return done(new Error('Email not provided by Facebook'));

          let user = await prisma.user.findFirst({
            where: { OR: [{ providerId }, { email }] }
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name,
                gradeLevel: 1,
                passwordHash: '',
                provider: 'FACEBOOK',
                providerId
              }
            });
          } else if (!user.providerId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { providerId, provider: 'FACEBOOK' }
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
  if (!env.googleClientId) return res.status(503).json({ message: 'Google OAuth not configured' });
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: env.oauthRedirect }),
  (req, res) => {
    const user = req.user as any;
    const token = signToken(buildPayload(user));
    return redirectWithToken(res, token);
  }
);

router.get('/facebook', (req, res, next) => {
  if (!env.facebookClientId) return res.status(503).json({ message: 'Facebook OAuth not configured' });
  passport.authenticate('facebook', { scope: ['email'], session: false })(req, res, next);
});

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: env.oauthRedirect }),
  (req, res) => {
    const user = req.user as any;
    const token = signToken(buildPayload(user));
    return redirectWithToken(res, token);
  }
);

export default router;
