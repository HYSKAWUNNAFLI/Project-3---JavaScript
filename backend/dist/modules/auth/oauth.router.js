"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
const buildPayload = (user) => ({
    userId: user.id,
    email: user.email,
    name: user.name,
    gradeLevel: user.gradeLevel
});
const signToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, { expiresIn: '7d' });
const redirectWithToken = (res, token, error) => {
    const url = new URL(env_1.env.oauthRedirect);
    if (error)
        url.searchParams.set('error', error);
    url.searchParams.set('token', token);
    return res.redirect(url.toString());
};
// Google strategy
if (env_1.env.googleClientId && env_1.env.googleClientSecret) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: env_1.env.googleClientId,
        clientSecret: env_1.env.googleClientSecret,
        callbackURL: `${env_1.env.apiBaseUrl}/api/auth/oauth/google/callback`
    }, async (_access, _refresh, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            const providerId = profile.id;
            const name = profile.displayName || email || 'Google User';
            if (!email)
                return done(new Error('Email not provided by Google'));
            let user = await prisma_1.prisma.user.findFirst({
                where: { OR: [{ providerId }, { email }] }
            });
            if (!user) {
                user = await prisma_1.prisma.user.create({
                    data: {
                        email,
                        name,
                        gradeLevel: 1,
                        passwordHash: '',
                        provider: 'GOOGLE',
                        providerId
                    }
                });
            }
            else if (!user.providerId) {
                // link providerId for existing email login
                await prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: { providerId, provider: 'GOOGLE' }
                });
            }
            return done(null, user);
        }
        catch (e) {
            return done(e);
        }
    }));
}
// Facebook strategy
if (env_1.env.facebookClientId && env_1.env.facebookClientSecret) {
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: env_1.env.facebookClientId,
        clientSecret: env_1.env.facebookClientSecret,
        callbackURL: `${env_1.env.apiBaseUrl}/api/auth/oauth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails']
    }, async (_access, _refresh, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            const providerId = profile.id;
            const name = profile.displayName || email || 'Facebook User';
            if (!email)
                return done(new Error('Email not provided by Facebook'));
            let user = await prisma_1.prisma.user.findFirst({
                where: { OR: [{ providerId }, { email }] }
            });
            if (!user) {
                user = await prisma_1.prisma.user.create({
                    data: {
                        email,
                        name,
                        gradeLevel: 1,
                        passwordHash: '',
                        provider: 'FACEBOOK',
                        providerId
                    }
                });
            }
            else if (!user.providerId) {
                await prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: { providerId, provider: 'FACEBOOK' }
                });
            }
            return done(null, user);
        }
        catch (e) {
            return done(e);
        }
    }));
}
router.get('/google', (req, res, next) => {
    if (!env_1.env.googleClientId)
        return res.status(503).json({ message: 'Google OAuth not configured' });
    passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: env_1.env.oauthRedirect }), (req, res) => {
    const user = req.user;
    const token = signToken(buildPayload(user));
    return redirectWithToken(res, token);
});
router.get('/facebook', (req, res, next) => {
    if (!env_1.env.facebookClientId)
        return res.status(503).json({ message: 'Facebook OAuth not configured' });
    passport_1.default.authenticate('facebook', { scope: ['email'], session: false })(req, res, next);
});
router.get('/facebook/callback', passport_1.default.authenticate('facebook', { session: false, failureRedirect: env_1.env.oauthRedirect }), (req, res) => {
    const user = req.user;
    const token = signToken(buildPayload(user));
    return redirectWithToken(res, token);
});
exports.default = router;
