import { Injectable } from '@nestjs/common';
import { ContextOptions, TRPCContext } from 'nestjs-trpc';
import { IAppContext } from './trpc.context';

@Injectable()
export class AppContext implements TRPCContext {
  async create(opt: ContextOptions): Promise<{ req: any; res: any }> {
    return {
      req: opt.req,
      res: opt.res,
    };
  }
}
