import { All, Controller, Inject, OnModuleInit } from '@nestjs/common';
import { renderTrpcPanel } from 'trpc-panel';
import { AnyRouter } from '@trpc/server';
import { AppRouterHost } from 'nestjs-trpc';
import { ApiExcludeController } from '@nestjs/swagger';
 
@ApiExcludeController()
@Controller()
export class TrpcPanelController implements OnModuleInit {
  private appRouter!: AnyRouter;
 
  constructor(
    @Inject(AppRouterHost) private readonly appRouterHost: AppRouterHost,
  ) {}
 
  onModuleInit() {
    this.appRouter = this.appRouterHost.appRouter;
  }
 
  @All('/panel')
  panel(): string {
    return renderTrpcPanel(this.appRouter, {
      url: 'http://localhost/trpc',
    });
  }
}