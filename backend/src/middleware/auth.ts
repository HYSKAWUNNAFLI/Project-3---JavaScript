import { NextFunction, Request, Response, type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  gradeLevel: number;
  provider?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const authenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const [, token] = authHeader.split(' ');
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    authReq.user = decoded;
  } catch {
    // Ignore bad tokens and continue without auth
  }

  return next();
};

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
};
