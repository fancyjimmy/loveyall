import { ServerHandler } from '../../socket/ServerHandler';
import type { Server, Socket } from 'socket.io';
import { ServerChatHandler } from './index';
import type { ChatRoomHandler } from './types';

const unreservedChars = [
	'-',
	'_',
	'.',
	'~',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9'
];

export default class ServerChatRoomHandler extends ServerHandler<ChatRoomHandler> {
	rooms = new Map<string, ServerChatHandler>();

	constructor(io: Server) {
		super('chatRoom', io, {
			create: ({ name }, socket, io) => {
				name = name.trim();

				if (name === 'general') {
					this.emitError(socket, "general isn't a valid room name");
					return;
				}
				if (!this.isValidName(name)) {
					this.emitError(
						socket,
						`${name} isn't a valid room name, because it has illegal characters`
					);

					name = this.removeIllegalChars(name);
				}

				if (!name) {
					this.emitError(socket, `room name is empty`);
					return;
				}

				if (this.rooms.has(name)) {
					this.emitError(socket, `${name} already exists`);
					socket.emit('roomExists', { name: name });
					return;
				} else {
					const room = new ServerChatHandler(this.io, name, true);
					this.rooms.set(room.roomName, room);
					room.whenUserChanges((count) => {
						this.broadcastRoomChange();
					});
					this.broadcastRoomChange();
					socket.emit('roomCreated', { name: room.roomName });
					this.listenToChatRoom(room);
				}
			},
			get: (data, socket, io) => {
				this.broadcastRoomChange();
				this.emitRooms(socket);
				socket.join(this.prefix);
			},
			leave: (data, socket, io) => {
				socket.leave(this.prefix);
			}
		});
	}

	isValidName(name: string) {
		return name.split('').every((char) => unreservedChars.includes(char));
	}

	removeIllegalChars(name: string) {
		return name
			.split('')
			.map((char) => (char === ' ' ? '-' : char))
			.filter((char) => unreservedChars.includes(char))
			.join('');
	}

	broadcastRoomChange() {
		let rooms = Array.from(this.rooms.values()).map((values) => {
			return {
				name: values.roomName,
				userCount: values.userCount
			};
		});
		this.io.to(this.prefix).emit('rooms', rooms);
	}

	emitError(socket: Socket, error: string) {
		socket.emit('error', error);
	}

	listenToChatRoom(room: ServerChatHandler) {
		const listener = (socket: Socket) => {
			room.registerSocket(this.io.of(room.namespaceName), socket);
		};

		// new Sockets are automatically able to join the new room
		this.io.on('connection', listener);

		// old sockets are able to join the new room
		room.register();

		room.whenClosing(() => {
			console.log('chatroom', `room ${room.roomName} was closed`);
			this.rooms.delete(room.roomName);
			// new Sockets are not able to join the new room
			room.unregister(true);
			// old sockets are not able to join the new room
			this.broadcastRoomChange();
		});
	}

	emitRooms(socket: Socket) {
		let rooms = Array.from(this.rooms.values()).map((values) => {
			return {
				name: values.roomName,
				userCount: values.userCount
			};
		});

		socket.emit('rooms', rooms);
	}
}
