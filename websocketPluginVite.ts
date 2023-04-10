import injectSocketIO from './src-socket-io';

export const webSocketServer = {
    name: 'webSocketServer',
    configureServer(server: any) {
        injectSocketIO(server.httpServer);
    }
};