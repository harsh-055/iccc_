import { Inject, Injectable, Logger } from '@nestjs/common';
import { MiddlewareOptions, TRPCMiddleware } from 'nestjs-trpc';
import { IAppContext } from './trpc.context';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
@Injectable()
export class LoggerMiddleware implements TRPCMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}


  async use(opts: MiddlewareOptions<IAppContext>) {
    const start = Date.now();
    const { next, path, type } = opts;
    const result:any = await next();
    // const { req, res } = opts.ctx;
    // const key = `cacheReq:${req.ip}:${req.method}:${path}`;

    // const cacheAvaliable = await this.cacheManager.get(key);
    // console.log(result)
    // if (cacheAvaliable) {
    //   // return cacheAvaliable;
    //   console.log('cacheAvaliable', cacheAvaliable);
    // }
    // await this.cacheManager.set(key, result, 10000);

    return result;
  }
}
