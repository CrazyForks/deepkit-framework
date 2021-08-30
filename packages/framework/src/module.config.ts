/*
 * Deepkit Framework
 * Copyright (C) 2021 Deepkit UG, Marc J. Schmidt
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */

import { t } from '@deepkit/type';
import { AppModuleConfig } from '@deepkit/app';
import { Session } from './session';

export const frameworkConfig = new AppModuleConfig({
    host: t.string.default('0.0.0.0'), //binding to localhost is roughly 20% faster.
    port: t.number.default(8080),
    httpsPort: t.number.optional.description('If httpsPort and ssl is defined, then the https server is started additional to the http-server.'),
    selfSigned: t.boolean.optional.description('If for ssl: true the certificate and key should be automatically generated.'),
    keepAliveTimeout: t.number.optional,
    path: t.string.default('/'),
    workers: t.number.default(0).description('A value of 0 means the main process handles requests alone. A value of > 0 means the main process does not handle any requests and anything is redirected to workers'),
    ssl: t.boolean.default(false).description("Enables HTTPS server"),
    sslOptions: t.any.description("Same interface as tls.SecureContextOptions & tls.TlsOptions."),
    sslKey: t.string.optional.description('A file path to a ssl key file for https'),
    sslCertificate: t.string.optional.description('A file path to a certificate file for https'),
    sslCa: t.string.optional.description('A file path to a ca file for https'),
    sslCrl: t.string.optional.description('A file path to a crl file for https'),
    server: t.any, //todo: change to t.classType(Server)
    maxPayload: t.number.optional,
    publicDir: t.string.optional.description('A path to a folder that should be served per default. Relative to cwd.'),
    publicDirPrefix: t.string.default('/').description('Per default the folder specified in publicDir is available under /. Change that to a URL prefix of your choice'),
    debug: t.boolean.default(false),
    debugUrl: t.string.default('_debug'),
    debugProfiler: t.boolean.default(true),
    debugBrokerHost: t.string.default('var/debug-broker.sock').description('IP:Port or unix socket name or named pipes'),
    varPath: t.string.default('var/'),
    debugStorePath: t.string.default('debug/').description('Relative to {varPath} option'),
    httpLog: t.boolean.default(true),

    session: t.any.default(Session).description('The session ClassType'),
    migrateOnStartup: t.boolean.default(false).description('Whether all registered database should be migrated automatically on startup.'),
    migrationDir: t.string.default('migrations'),
});