import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Attaches a stable X-Request-Id to every request/response for structured
 * logging and audit-log correlation.
 */
export class RequestIdMiddleware {
  use = (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.header('x-request-id');
    const requestId = incoming && incoming.length < 128 ? incoming : randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  };
}
