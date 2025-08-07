import { Injectable } from '@nestjs/common';
import { ContextOptions, TRPCContext } from 'nestjs-trpc';
import { Request, Response } from 'express';
@Injectable()
export class AppContext implements TRPCContext {
  async create(opt: ContextOptions): Promise<Record<string, unknown>> {
    return {
      req: opt.req as unknown as Record<string, unknown>,
      res: opt.res as unknown as Record<string, unknown>,
    };
  }
}

export interface IAppContext {
  req: Request;
  res: Response;
}
