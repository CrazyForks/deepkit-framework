import { HttpListener, HttpResultFormatter, httpWorkflow } from './http';
import { HttpConfig } from './module.config';
import { AppModule, createModule } from '@deepkit/app';
import { HttpRouter, HttpRouterRegistry } from './router';
import { HttpKernel } from './kernel';
import { HttpRouterFilterResolver } from './filter';
import { HttpControllers } from './controllers';
import { ConsoleTransport, Logger } from '@deepkit/logger';
import { HttpRequest, HttpResponse } from './model';
import '@deepkit/type';
import { ClassType } from '@deepkit/core';
import { httpClass } from './decorator';

export class HttpModule extends createModule({
    config: HttpConfig,
    providers: [
        HttpRouter,
        HttpKernel,
        HttpResultFormatter,
        HttpRouterRegistry,
        HttpRouterFilterResolver,
        { provide: HttpResponse, scope: 'http' },
        { provide: HttpRequest, scope: 'http' },
        { provide: Logger, useValue: new Logger([new ConsoleTransport()]) },
    ],
    listeners: [
        HttpListener,
    ],
    workflows: [
        httpWorkflow
    ],
    exports: [
        HttpRouter,
        HttpRouterRegistry,
        HttpKernel,
        HttpResultFormatter,
        HttpRouterFilterResolver,
        HttpResponse,
        HttpRequest,
        HttpControllers,
        Logger,
    ]
}) {
    protected httpControllers = new HttpControllers;

    process() {
        this.addProvider({ provide: HttpControllers, useValue: this.httpControllers });
    }

    processController(module: AppModule<any>, controller: ClassType) {
        const httpConfig = httpClass._fetch(controller);
        if (!httpConfig) return;

        if (!module.isProvided(controller)) module.addProvider({ provide: controller, scope: 'http' });
        this.httpControllers.add(controller, module);
    }
}
