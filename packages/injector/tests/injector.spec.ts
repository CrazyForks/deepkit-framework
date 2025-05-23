import { expect, test } from '@jest/globals';
import {
    CircularDependencyError,
    DependenciesUnmetError,
    injectedFunction,
    Injector,
    InjectorContext,
    PartialFactory,
    TransientInjectionTarget,
} from '../src/injector.js';
import { InjectorModule } from '../src/module.js';
import { Inject } from '@deepkit/core';
import { ReflectionClass, ReflectionKind, typeOf } from '@deepkit/type';
import { provide } from '../src/provider.js';

export const a = 'asd';

test('injector basics', () => {
    class Connection {
    }

    class MyServer {
        constructor(private connection: Connection) {
            expect(connection).toBeInstanceOf(Connection);
        }
    }

    const injector = Injector.from([MyServer, Connection]);
    expect(injector.get(Connection)).toBeInstanceOf(Connection);
    expect(injector.get(MyServer)).toBeInstanceOf(MyServer);
    expect(injector.get<Connection>()).toBeInstanceOf(Connection);
});

test('useExisting 1', () => {
    class Service {}
    const injector = Injector.from([Service, { provide: 'token', useExisting: Service }]);
    expect(injector.get(Service)).toBeInstanceOf(Service);
    expect(injector.get<Service>()).toBeInstanceOf(Service);
    expect(injector.get<Service>('token')).toBeInstanceOf(Service);
});

test('useExisting 2', () => {
    class Service {}
    class Service2 {}
    const injector = Injector.from([Service, provide<Service2>({useExisting: Service})]);
    expect(injector.get(Service)).toBeInstanceOf(Service);
    expect(injector.get<Service>()).toBeInstanceOf(Service);
});

test('useExisting 3', () => {
    class Service {}
    class Service2 {}
    const injector = Injector.from([provide<Service>(), provide<Service2>({useExisting: typeOf<Service>()})]);
    expect(injector.get(Service)).toBeInstanceOf(Service);
    expect(injector.get(Service2)).toBeInstanceOf(Service);
    expect(injector.get<Service>()).toBeInstanceOf(Service);
    expect(injector.get<Service2>()).toBeInstanceOf(Service);
});

test('missing dep', () => {
    class Connection {
    }

    class Missing {
    }

    class MyServer {
        constructor(private connection: Connection, private missing: Missing) {
            expect(connection).toBeInstanceOf(Connection);
        }
    }

    expect(() => Injector.from([MyServer, Connection])).toThrow(`Undefined dependency "missing: Missing" of MyServer(✓, ?)`);
});

test('wrong dep 1', () => {
    class Connection {
    }

    class MyServer {
        constructor(private connection: Connection, private missing: any) {
            expect(connection).toBeInstanceOf(Connection);
        }
    }

    expect(() => Injector.from([MyServer, Connection])).toThrow(`Undefined dependency "missing: any" of MyServer(✓, ?).`);
});

test('wrong dep 2', () => {
    class MyServer {
        constructor(private missing: any) {
        }
    }

    expect(() => Injector.from([MyServer])).toThrow(`Undefined dependency "missing: any" of MyServer(?).`);
});

test('wrong dep 3', () => {
    class MyServer {
        private missing: Inject<any>;
    }

    expect(() => Injector.from([MyServer])).toThrow(`Undefined dependency "missing: any" of MyServer.missing.`);
});

test('wrong optional dep 3', () => {
    class MyServer {
        private missing?: Inject<any>;
    }

    const server = Injector.from([MyServer]).get(MyServer);
    expect(server).toBeInstanceOf(MyServer);
});

test('dont touch normal property', () => {
    class MyServer {
        missing: any = 2;
    }

    const server = Injector.from([MyServer]).get(MyServer);
    expect(server).toBeInstanceOf(MyServer);
    expect(server.missing).toBe(2);
});

test('injector key', () => {
    class MyServer {
        constructor(private foo: Inject<string, 'foo'>) {
            expect(foo).toBe('bar');
        }
    }

    const injector = Injector.from([MyServer, { provide: 'foo', useValue: 'bar' }]);
    expect(injector.get('foo')).toBe('bar');
    expect(injector.get(MyServer)).toBeInstanceOf(MyServer);
});

test('interface dependency provide implementation implementing interface shallow', () => {
    interface Connection {
        id: number;

        write(data: Uint16Array): void;
    }

    class MyConnection implements Connection {
        id: number = 0;

        write(data: Uint16Array): void {
        }

        additional(): void {
        }
    }

    class MyServer {
        constructor(public connection: Connection) {
        }
    }

    const injector = Injector.from([MyServer, MyConnection]);
    const server = injector.get(MyServer);
    expect(server).toBeInstanceOf(MyServer);
    expect(server.connection).toBeInstanceOf(MyConnection);
    expect(server.connection.id).toBe(0);
});

test('interface dependency provide implementation implementing interface deep 1', () => {
    interface Connection {
        id: number;

        write(data: Uint16Array): void;
    }

    class MyConnection implements Connection {
        id: number = 0;

        write(data: Uint16Array): void {
        }

        additional(): void {
        }
    }

    class SecondConnection extends MyConnection {

    }

    class MyServer {
        constructor(public connection: Connection) {
        }
    }

    const injector = Injector.from([MyServer, SecondConnection]);
    const server = injector.get(MyServer);
    expect(server).toBeInstanceOf(MyServer);
    expect(server.connection).toBeInstanceOf(SecondConnection);
    expect(server.connection.id).toBe(0);
});

test('interface dependency provide interface', () => {
    interface Connection {
        id: number;

        write(data: Uint16Array): void;
    }

    class MyConnection implements Connection {
        id: number = 0;

        write(data: Uint16Array): void {
        }

        additional(): void {
        }
    }

    class MyServer {
        constructor(public connection: Connection) {
        }
    }

    const injector = Injector.from([MyServer, provide<Connection>(MyConnection)]);
    const server = injector.get(MyServer);
    expect(server).toBeInstanceOf(MyServer);
    expect(server.connection).toBeInstanceOf(MyConnection);
    expect(server.connection.id).toBe(0);
});

test('interface dependency over specified', () => {
    interface Connection {
        id: number;

        write(data: Uint16Array): void;
    }

    class MyConnection implements Connection {
        id: number = 0;

        write(data: Uint16Array): void {
        }

        additional(): void {

        }
    }

    class MyServer {
        constructor(public connection: Connection) {
        }
    }

    const injector = Injector.from([MyServer, provide<MyConnection>(MyConnection)]);
    const server = injector.get(MyServer);
    expect(server).toBeInstanceOf(MyServer);
    expect(server.connection).toBeInstanceOf(MyConnection);
    expect(server.connection.id).toBe(0);
});

test('interface dependency multiple matches', () => {
    interface Connection {
        write(data: Uint16Array): void;
    }

    class MyConnection1 implements Connection {
        write(data: Uint16Array): void {
        }
    }

    class MyConnection2 implements Connection {
        write(data: Uint16Array): void {
        }
    }

    class MyServer {
        constructor(public connection: Connection) {
        }
    }

    {
        expect(() => Injector.from([MyServer, provide<{ write(invalid: Uint32Array): void }>(MyConnection1)])).toThrow('Undefined dependency "connection');
    }

    {
        const injector = Injector.from([MyServer, provide<Connection>(MyConnection1)]);
        const server = injector.get(MyServer);
        expect(server.connection).toBeInstanceOf(MyConnection1);
    }

    {
        //last match wins
        const injector = Injector.from([MyServer, provide<Connection>(MyConnection1), provide<Connection>(MyConnection2)]);
        const server = injector.get(MyServer);
        expect(server.connection).toBeInstanceOf(MyConnection2);
    }
});

test('interface dependency under specified', () => {
    interface Connection {
        id: number;

        write(data: Uint16Array): void;
    }

    class MyConnection implements Connection {
        id: number = 0;

        write(data: Uint16Array): void {
        }
    }

    class MyServer {
        constructor(public connection: Connection) {
        }
    }

    expect(() => Injector.from([MyServer, provide<{ id: number }>(MyConnection)])).toThrow(`Undefined dependency "connection: `);
});

test('injector transient', () => {
    class Connection {
    }

    class MyServer {
        constructor(public connection: Connection) {
            expect(connection).toBeInstanceOf(Connection);
        }
    }

    const injector = Injector.from([MyServer, { provide: Connection, transient: true }]);
    const c1 = injector.get(Connection);
    const c2 = injector.get(Connection);
    expect(c1).toBeInstanceOf(Connection);
    expect(c2).toBeInstanceOf(Connection);
    expect(c1 !== c2).toBe(true);

    const s1 = injector.get(MyServer);
    const s2 = injector.get(MyServer);
    expect(s1).toBeInstanceOf(MyServer);
    expect(s2).toBeInstanceOf(MyServer);

    expect(s1.connection).toBeInstanceOf(Connection);
    expect(s2.connection).toBeInstanceOf(Connection);

    expect(s1 === s2).toBe(true);
    expect(s1.connection === s2.connection).toBe(true);
    expect(s1.connection !== c1).toBe(true);
    expect(s2.connection !== c2).toBe(true);
});

test('injector property injection', () => {
    class Connection {
    }

    class MyServer {
        public connection!: Inject<Connection>;

        constructor(public name: Inject<string, 'name'>) {
        }
    }

    const injector = Injector.from([MyServer, Connection, { provide: 'name', useValue: 'peter' }]);
    const s = injector.get(MyServer);
    expect(s.connection).toBeInstanceOf(Connection);
    expect(s.name).toBe('peter');
});

test('factory with Inject<>', () => {
    const injector = Injector.from([
        { provide: "stripe", useValue: true },
        { provide: "test", useFactory(name: Inject<any, 'stripe'>) { return name } },
    ]);

    const s = injector.get("test");
    expect(s).toBe(true);
});

test('injector overwrite token', () => {
    class Connection {
    }

    class Connection2 extends Connection {
    }

    class MyServer {
        constructor(private connection: Inject<Connection, Connection2>) {
            expect(connection).toBeInstanceOf(Connection2);
        }
    }

    {
        const injector = Injector.from([MyServer, Connection, Connection2]);
        expect(injector.get(Connection)).toBeInstanceOf(Connection);
        expect(injector.get(MyServer)).toBeInstanceOf(MyServer);
    }
});

test('injector unmet dependency', () => {
    class Connection {
    }

    class MyServer {
        constructor(private connection: Connection) {
            expect(connection).toBeUndefined();
        }
    }

    {
        expect(() => Injector.from([MyServer])).toThrow(`Undefined dependency "connection: Connection" of MyServer(?)`);
    }
});

test('injector optional unmet dependency', () => {
    class Connection {
    }

    class MyServer {
        constructor(private connection?: Connection) {
            expect(connection).toBeUndefined();
        }
    }

    {
        const injector = Injector.from([MyServer]);
        expect(injector.get(MyServer)).toBeInstanceOf(MyServer);
    }
});

test('injector optional dependency', () => {
    class Connection {
    }

    class MyServer {
        constructor(private connection?: Connection) {
            expect(connection).toBeUndefined();
        }
    }

    {
        const injector = Injector.from([MyServer]);
        expect(() => injector.get(Connection)).toThrow(`Service 'Connection' not found`);
        expect(injector.get(MyServer)).toBeInstanceOf(MyServer);
    }
});

test('injector Inject<, T>', () => {
    interface ConnectionInterface {
    }

    class Connection {
    }

    class MyServer {
        constructor(public connection: Inject<ConnectionInterface, Connection>) {
        }
    }

    {
        const injector = Injector.from([MyServer, Connection]);
        expect(injector.get(MyServer)).toBeInstanceOf(MyServer);
        expect(injector.get(MyServer).connection).toBeInstanceOf(Connection);
    }
});

test('injector via Inject string', () => {
    interface ConnectionInterface {
    }

    class Connection {
    }

    class MyServer {
        constructor(public connection: Inject<ConnectionInterface, 'connection'>) {
        }
    }

    {
        const injector = Injector.from([MyServer, { provide: 'connection', useClass: Connection }]);
        expect(injector.get(MyServer)).toBeInstanceOf(MyServer);
        expect(injector.get(MyServer).connection).toBeInstanceOf(Connection);
    }
});

test('injector overwrite provider', () => {
    class Connection {
    }

    class Connection2 extends Connection {
    }

    class MyServer {
        constructor(private connection: Connection) {
            expect(connection).toBeInstanceOf(Connection2);
        }
    }

    {
        const injector = Injector.from([MyServer, {
            provide: Connection, useClass: Connection2
        }]);
        expect(injector.get(Connection)).toBeInstanceOf(Connection2);
        expect(injector.get(MyServer)).toBeInstanceOf(MyServer);
    }
});

declare var asd: any;

test('invalid constructor 1', () => {
    class Service {}

    class MyServer {
        constructor() {
            asd.asd = [];
        }
    }

    const injector = Injector.from([MyServer]);
    expect(() => injector.get(MyServer)).toThrow(`asd is not defined`);
    expect(() => injector.get(MyServer)).toThrow(`asd is not defined`);
});

test('invalid constructor 2', () => {
    class Service {}

    class MyServer {
        constructor(private service: Service) {
            asd.asd = [];
        }
    }

    const injector = Injector.from([MyServer, Service]);
    expect(() => injector.get(MyServer)).toThrow(`asd is not defined`);
    expect(() => injector.get(MyServer)).toThrow(`asd is not defined`);
});

test('injector direct circular dependency', () => {
    class MyServer {
        constructor(private myServer: MyServer) {
        }
    }

    {
        const injector = Injector.from([MyServer]);
        expect(() => injector.get(MyServer)).toThrow(CircularDependencyError as any);
    }
});

test('injector circular dependency', () => {
    class Connection {
        constructor(myServer: MyServer) {
            expect(myServer).not.toBeUndefined();
            expect(myServer).toBeInstanceOf(MyServer);
        }
    }

    class MyServer {
        constructor(connection: Connection) {
            expect(connection).not.toBeUndefined();
            expect(connection).toBeInstanceOf(Connection);
        }
    }

    {
        const injector = Injector.from([MyServer, Connection]);
        expect(() => injector.get(MyServer)).toThrow(CircularDependencyError as any);
        expect(() => injector.get(MyServer)).toThrow('Circular dependency found MyServer -> Connection -> MyServer');
    }
});

test('injector factory', () => {
    class Service {
    }

    {
        const injector = Injector.from([{ provide: Service, useFactory: () => new Service() }]);

        const s1 = injector.get(Service);
        expect(s1).toBeInstanceOf(Service);

        const s2 = injector.get(Service);
        expect(s2).toBeInstanceOf(Service);
        expect(s2).toBe(s1);
    }
});

test('injector factory deps', () => {
    class Service {
        constructor(public config: Config) {
        }
    }

    class Config {
    }

    {
        const injector = Injector.from([Config, { provide: Service, useFactory: (config: Config) => new Service(config) }]);

        const s1 = injector.get(Service);
        expect(s1).toBeInstanceOf(Service);
        expect(s1.config).toBeInstanceOf(Config);

        const s2 = injector.get(Service);
        expect(s2).toBeInstanceOf(Service);
        expect(s2).toBe(s1);
    }
});

test('injector config', () => {
    class ModuleConfig {
        debug: boolean = false;
        title: string = '';
        db: { url: string } = { url: '' };
    }

    class MyService {
        constructor(public config: Pick<ModuleConfig, 'debug'>) {
        }
    }

    const reflection = ReflectionClass.from(MyService);
    const parameters = reflection.getMethodParameters('constructor');
    expect(parameters[0].getType()).toMatchObject({
        kind: ReflectionKind.objectLiteral,
        types: [
            { kind: ReflectionKind.propertySignature, name: 'debug', type: { kind: ReflectionKind.boolean } },
        ]
    });

    class MyService2 {
        constructor(public config: ModuleConfig) {
        }
    }

    class MyService3 {
        constructor(public title: ModuleConfig['title']) {
        }
    }

    class MyService4 {
        constructor(public dbUrl: ModuleConfig['db']['url']) {
        }
    }

    {
        const i1 = Injector.fromModule(new InjectorModule([MyService, MyService2, MyService3, MyService4]).setConfigDefinition(ModuleConfig));
        expect(i1.get(MyService).config).toEqual({ debug: false });
        expect(i1.get(MyService2).config).toEqual({ debug: false, title: '', db: { url: '' } });
        expect(i1.get(MyService3).title).toBe('');
        expect(i1.get(MyService4).dbUrl).toBe('');
    }

    {
        const i1 = Injector.fromModule(new InjectorModule([MyService, MyService2, MyService3, MyService4]).setConfigDefinition(ModuleConfig));
        i1.module.configure({ debug: true, title: 'MyTitle', db: { url: 'mongodb://localhost' } });
        expect(i1.get(MyService).config).toEqual({ debug: true });
        expect(i1.get(MyService2).config).toEqual({ debug: true, title: 'MyTitle', db: { url: 'mongodb://localhost' } });
        expect(i1.get(MyService3).title).toBe('MyTitle');
        expect(i1.get(MyService4).dbUrl).toBe('mongodb://localhost');
    }
});

test('setup provider', () => {
    class MyService {
        transporter: string[] = [];

        addTransporter(t: string) {
            this.transporter.push(t);
        }
    }

    {
        const i1 = Injector.from([MyService]);
        expect(i1.get(MyService).transporter).toEqual([]);
    }

    {
        const module = new InjectorModule([MyService]);
        module.configureProvider<MyService>(v => v.addTransporter('a'));
        module.configureProvider<MyService>(v => v.addTransporter('b'));
        expect(module.configurationProviderRegistry.get(MyService).length).toBe(2);
        const i1 = Injector.fromModule(module);
        expect(i1.get(MyService).transporter).toEqual(['a', 'b']);
    }

    {
        const module = new InjectorModule([MyService]);
        module.configureProvider<MyService>(v => v.transporter = ['a']);
        module.configureProvider<MyService>(v => v.transporter = ['a', 'b', 'c']);
        expect(module.configurationProviderRegistry.get(MyService).length).toBe(2);
        const i1 = Injector.fromModule(module);
        expect(i1.get(MyService).transporter).toEqual(['a', 'b', 'c']);
    }
});

test('loggerInterface', () => {
    type LogData = { [name: string]: any };

    enum LoggerLevel {
        none,
        alert,
        error,
        warning,
        log,
        info,
        debug,
    }

    interface LoggerInterface {
        level: LoggerLevel;

        scoped(name: string): LoggerInterface;

        data(data: LogData): LoggerInterface;

        is(level: LoggerLevel): boolean;

        alert(...message: any[]): void;

        error(...message: any[]): void;

        warning(...message: any[]): void;

        log(...message: any[]): void;

        info(...message: any[]): void;

        debug(...message: any[]): void;
    }

    class MyServer {
        constructor(public logger: LoggerInterface) {
        }
    }

    class Logger {
    }

    const injector = Injector.from([MyServer, provide<LoggerInterface>(Logger)]);
    const server = injector.get(MyServer);
    expect(server).toBeInstanceOf(MyServer);
    expect(server.logger).toBeInstanceOf(Logger);
});

test('class inheritance', () => {
    class A {}

    class B {
        constructor(public a: A) {
        }
    }

    class C extends B {}

    const injector = Injector.from([A, C]);
    const c = injector.get(C);
    expect(c).toBeInstanceOf(C);
    expect(c).toBeInstanceOf(B);
    expect(c.a).toBeInstanceOf(A);
});

test('injectedFunction all', () => {
    class A {}
    class B {}
    const injector = Injector.from([A, B]);

    function render(a: A, b: B) {
        expect(a).toBeInstanceOf(A);
        expect(b).toBeInstanceOf(B);
        return true;
    }

    const wrapped = injectedFunction(render, injector);

    expect(wrapped()).toBe(true);
});

test('injectedFunction scope', () => {
    class A {}
    class B {
        constructor(public id: number) {
        }
    }
    const injector = InjectorContext.forProviders([A, {provide: B, scope: 'http', useValue: new B(0)}]);

    function render(a: A, b: B) {
        expect(a).toBeInstanceOf(A);
        expect(b).toBeInstanceOf(B);
        return b.id;
    }

    const wrapped = injectedFunction(render, injector.getRootInjector());

    {
        const scope = injector.createChildScope('http');
        expect(wrapped(scope.scope)).toBe(0);
    }
    {
        const scope = injector.createChildScope('http');
        scope.set(B, new B(1));
        expect(wrapped(scope.scope)).toBe(1);
    }
    {
        const scope = injector.createChildScope('http');
        scope.set(B, new B(2));
        expect(wrapped(scope.scope)).toBe(2);
    }
});

test('injectedFunction skip 1', () => {
    class A {}
    class B {}
    const injector = Injector.from([A, B]);

    function render(html: string, a: A, b: B) {
        expect(a).toBeInstanceOf(A);
        expect(b).toBeInstanceOf(B);
        return html;
    }

    const wrapped = injectedFunction(render, injector, 1);

    expect(wrapped(undefined, 'abc')).toBe('abc');
});

test('injectedFunction skip 2', () => {
    class A {}
    class B {}
    const injector = Injector.from([A, B]);

    function render(html: string, a: A, b: B) {
        expect(a).toBeInstanceOf(A);
        expect(b).toBeInstanceOf(B);
        return html;
    }

    const wrapped = injectedFunction(render, injector, 2);

    expect(wrapped(undefined, 'abc', new A)).toBe('abc');
});

test('TransientInjectionTarget', () => {
    {
        class A {
            constructor (public readonly b: B) {
            }
        }

        class B {
            constructor (
                public readonly target: TransientInjectionTarget
            ) {
            }
        }

        const injector = Injector.from([A, { provide: B, transient: true }]);
        const a = injector.get(A);
        expect(a.b.target).toBeInstanceOf(TransientInjectionTarget);
        expect(a.b.target.token).toBe(A);
    }

    {
        class A {
            constructor (public readonly b: B) {
            }
        }

        class B {
            constructor (
                public readonly target: TransientInjectionTarget
            ) {
            }
        }

        const injector = Injector.from([
            A,
            { provide: B, useFactory: (target: TransientInjectionTarget) => new B(target), transient: true }
        ]);
        const a = injector.get(A);
        expect(a.b.target).toBeInstanceOf(TransientInjectionTarget);
        expect(a.b.target.token).toBe(A);
    }

    {
        class A {
            constructor (public readonly b: B) {
            }
        }

        class B {
            constructor (
                public readonly target: TransientInjectionTarget
            ) {
            }
        }

        expect(() =>  Injector.from([A, B])).toThrow();
    }

    {
        class A {
            constructor (
                public readonly target: TransientInjectionTarget
            ) {
            }
        }

        const injector = Injector.from([{ provide: A, transient: true }]);
        expect(() => injector.get(A)).toThrow(DependenciesUnmetError);
    }

    {
        class A {
            constructor (
                public readonly target: TransientInjectionTarget
            ) {
            }
        }

        const injector = Injector.from([
            { provide: A, transient: true, useFactory: (target: TransientInjectionTarget) => new A(target) }
        ]);
        expect(() => injector.get(A)).toThrow(DependenciesUnmetError);
    }

    {
        class A {
            constructor (
                public readonly target?: TransientInjectionTarget
            ) {
            }
        }

        const injector = Injector.from([{ provide: A, transient: true }]);
        expect(() => injector.get(A)).not.toThrow();
    }

    {
        class A {
            constructor (public b: C) {
            }
        }

        class B {
            constructor (public target: TransientInjectionTarget) {
            }
        }

        class C {
            constructor (public target: TransientInjectionTarget) {
            }
        }

        const injector = Injector.from([
            A,
            { provide: B, transient: true },
            { provide: C, transient: true, useExisting: B },
        ]);
        const a = injector.get(A);
        expect(a.b).toBeInstanceOf(B);
        expect(a.b.target.token).toBe(A);
    }

    {
        class A {
            constructor (public b: B) {
            }
        }

        interface B {
            target: TransientInjectionTarget;
        }

        const injector = Injector.from([
            A,
            provide<B>({ transient: true, useFactory: (target: TransientInjectionTarget): B => ({ target }) }),
        ]);

        const a = injector.get(A);
        expect(a.b).toBeDefined();
        expect(a.b.target.token).toBe(A);
    }
});

test('PartialFactory', () => {
    {
        class A {
            constructor (public b: B, public num: number) {
            }
        }

        class B {
            public b = 'b';

            constructor() {
            }
        }

        const injector = Injector.from([B]);
        const factory = injector.getResolver<PartialFactory<A>>()();

        const a = factory({
            num: 5,
        });

        expect(a.b).toBeInstanceOf(B);
        expect(a.num).toBe(5);
    }

    {
        class A {
            public num!: Inject<number>;
            public b!: Inject<B>;
        }

        class B {
            public b = 'b';
        }

        const injector = Injector.from([B]);
        const factory = injector.get<PartialFactory<A>>();

        const a = factory({
            num: 6,
        });

        expect(a.b).toBeInstanceOf(B);
        expect(a.num).toBe(6);
    }

    {
        class A {
            constructor(public factory: PartialFactory<B>) {
            }
        }

        class B {
            constructor(public num: number, public c: C) {
            }
        }

        class C {
            public c = 'c';
        }

        const injector = Injector.from([A, C]);

        const a = injector.get(A);
        const b = a.factory({ num: 5 });

        expect(a.factory).toBeInstanceOf(Function);
        expect(b).toBeInstanceOf(B);
        expect(b.num).toBe(5);
        expect(b.c).toBeInstanceOf(C);
    }

    {
        class A {
            public b: B;
            public num: number;

            constructor(public factory: PartialFactory<{ b: B; num: number }>) {
                const { b, num } = factory({ num: 5 });
                this.b = b;
                this.num = num;
            }
        }

        class B {
            public b = 'b';
        }

        const injector = Injector.from([A, B]);
        const a = injector.get(A);

        expect(injector.get(B)).toBeInstanceOf(B);
        expect(a.b).toBeInstanceOf(B);
        expect(a.num).toBe(5);
    }
});

test('isProvided supports receive type', () => {
    interface A {
        b: string;
    }
    const providers = [provide<A>({ useValue: { b: 'a' } })];
    const module = new InjectorModule(providers)
    expect(module.isProvided<A>()).toBe(true);
});

test('isProvided supports token', () => {
    class A {}
    const providers = [A];
    const module = new InjectorModule(providers)
    expect(module.isProvided(A)).toBe(true);
});

test('throw error when both forRoot and exports are used', () => {
    class A {}

    class TestModule extends InjectorModule {}

    const module = new TestModule();
    module.forRoot();
    module.addProvider(A);
    module.addExport(A);

    const root = new InjectorModule();
    root.addImport(module);

    const injector = new InjectorContext(root);
    expect(() => injector.getRootInjector()).toThrowError();
})
