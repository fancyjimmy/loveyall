import type { TypedNamespaceHandler } from '../../socket/types';
import type { Namespace, Server, Socket } from 'socket.io';
import type { DefaultEventsMap, EventsMap } from 'socket.io/dist/typed-events';

type SocketEventListener = {
	socket: Socket;
	events: {
		[event: string]: (...args: any[]) => void;
	};
};

type Io<
	ListenEvents extends EventsMap = DefaultEventsMap,
	EmitEvents extends EventsMap = DefaultEventsMap,
	ServerSideEvents extends EventsMap = DefaultEventsMap,
	SocketData = any
> =
	| Namespace<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
	| Server<ListenEvents, EmitEvents, ServerSideEvents, SocketData>;

export class RoomHandler<Events, ClientEvents extends EventsMap> {
	private sockets: Socket<any, ClientEvents>[] = [];

	constructor(
		public readonly roomName: string,
		public readonly prefix: string,
		protected readonly io: Io<any, ClientEvents>,
		private readonly handler: TypedNamespaceHandler<Events>
	) {
		this.io = io;
		this.handler = handler;
	}

	join(sockets: Socket<any, ClientEvents>[]) {
		this.sockets = sockets;
		for (let socket of sockets) {
			socket.join(this.roomName);
		}
	}

	leave() {
		this.sockets.forEach((socket) => socket.leave(this.roomName));
	}
}
