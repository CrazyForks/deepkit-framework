import { expect, test } from '@jest/globals';
import { rpc } from '@deepkit/rpc';
import { App, AppModule, createModule, ServiceContainer } from '@deepkit/app';
import { FrameworkModule } from '../src/module';
import { Database, DatabaseRegistry, MemoryDatabaseAdapter } from '@deepkit/orm';

test('controller', () => {
    class MyService {
        constructor(private text: string = 'hello') {
        }

        getHello() {
            return this.text;
        }
    }

    @rpc.controller('test')
    class MyController {
        constructor(private myService: MyService) {
        }

        foo() {
            return this.myService.getHello();
        }
    }

    {
        const myModule = new AppModule({
            providers: [MyService],
            controllers: [MyController],
            imports: [
                new FrameworkModule()
            ]
        });

        const serviceContainer = new ServiceContainer(myModule);
        const rpcScopedContext = serviceContainer.getInjectorContext().createChildScope('rpc');
        const controller = rpcScopedContext.get(MyController, myModule);
        expect(controller).toBeInstanceOf(MyController);
        expect(controller.foo()).toBe('hello');
    }
});

test('controller in module and overwrite service', () => {
    class MyService {
        constructor(private text: string = 'hello') {
        }

        getHello() {
            return this.text;
        }
    }

    @rpc.controller('test')
    class MyController {
        constructor(private myService: MyService) {
        }

        foo() {
            return this.myService.getHello();
        }
    }

    class ControllerModule extends createModule({
        providers: [MyService],
        controllers: [MyController],
        exports: [
            MyService
        ]
    }, 'controller') {
    }

    {
        const myModule = new AppModule({
            imports: [new ControllerModule, new FrameworkModule()],
        });

        const serviceContainer = new ServiceContainer(myModule);
        const rpcScopedContext = serviceContainer.getInjectorContext().createChildScope('rpc');
        const controller = rpcScopedContext.get(MyController, serviceContainer.getModule(ControllerModule));
        expect(controller).toBeInstanceOf(MyController);
        expect(controller.foo()).toBe('hello');
    }

    {
        const myModule = new AppModule({
            providers: [
                { provide: MyService, useValue: new MyService('different') }
            ],
            imports: [new ControllerModule, new FrameworkModule()],
        });

        const serviceContainer = new ServiceContainer(myModule);
        const rpcScopedContext = serviceContainer.getInjectorContext().createChildScope('rpc');
        const controller = rpcScopedContext.get(MyController, serviceContainer.getModule(ControllerModule));
        expect(controller).toBeInstanceOf(MyController);
        expect(controller.foo()).toBe('different');
    }
});

test('database auto-detection', () => {
    class MyDatabase extends Database {
        constructor() {
            super(new MemoryDatabaseAdapter());
        }
    }

    const app = new App({
        providers: [MyDatabase],
        imports: [new FrameworkModule()]
    });

    const registry = app.get(DatabaseRegistry);
    expect(registry.getDatabases()).toHaveLength(1);
});

test('database injection', () => {
    class Service {
        constructor(public db: Database) {
        }
    }

    const app = new App({
        imports: [new FrameworkModule({ debug: true })],
        providers: [Service, { provide: Database, useValue: new Database(new MemoryDatabaseAdapter()) }],
    });

    const db = app.get(Database);
    expect(db).toBeInstanceOf(Database);

    const service = app.get(Service);
    expect(service.db).toBeInstanceOf(Database);

    const registry = app.get(DatabaseRegistry);
    expect(registry.getDatabases()).toHaveLength(1);
});
