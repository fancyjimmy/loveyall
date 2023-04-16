import {ServerHandler} from "../socket/ServerHandler";
import type {Server, Socket} from "socket.io";
import {logger} from "../Logging";
import {ServerChatHandler} from "./index";
import type {ChatRoomHandler} from "./types";

const unreservedChars = [
    '-', '_', '.', '~',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];

export default class ServerChatRoomHandler extends ServerHandler<ChatRoomHandler> {
    rooms = new Map<string, ServerChatHandler>();

    listenToChatRoom(io: Server, room: ServerChatHandler) {
        const listener = (socket: Socket) => {
            room.registerSocket(io.of(room.namespaceName), socket);
        };

        // new Sockets are automatically able to join the new room
        io.on("connection", listener);

        // old sockets are able to join the new room
        room.registerForEverySocket();

        room.whenClosing(() => {
            logger.log("chatroom", `room ${room.roomName} was closed`)
            this.rooms.delete(room.roomName);
            // new Sockets are not able to join the new room
            room.unregister(true);
            // old sockets are not able to join the new room
            this.broadcastRoomChange(io);
        });
    }

    isValidName(name: string) {

        return name.split("").every(char => unreservedChars.includes(char));
    }

    removeIllegalChars(name: string) {
        return name.split("").map(char => char === " " ? "-" : char).filter(char => unreservedChars.includes(char)).join("");
    }

    broadcastRoomChange(io: Server) {
        let rooms = Array.from(this.rooms.values()).map(values => {
            return {
                name: values.roomName,
                userCount: values.userCount
            }
        });
        io.to(this.nameSpace).emit("rooms", rooms);
    }

    emitError(socket: Socket, error: string) {
        socket.emit("error", error);
    }

    constructor() {
        super("chatRoom", {
            create: ({name}, socket, io) => {
                name = name.trim();

                if (name === "general") {
                    this.emitError(socket, "general isn't a valid room name");
                    logger.log("chatroom", `room ${name} is not allowed`, {extra: {socketId: socket.id}})
                    return;
                }
                if (!this.isValidName(name)) {
                    this.emitError(socket, `${name} isn't a valid room name, because it has illegal characters`);
                    logger.log("chatroom", `room ${name} is not allowed`, {extra: {socketId: socket.id}})
                    name = this.removeIllegalChars(name);
                    logger.log("chatroom", `room ${name} is used instead`, {extra: {socketId: socket.id}})
                }

                if (!name) {
                    this.emitError(socket, `room name is empty`);
                    logger.log("chatroom", `room name is empty`, {extra: {socketId: socket.id}})
                    return;
                }

                if (this.rooms.has(name)) {
                    this.emitError(socket, `${name} already exists`);
                    socket.emit("roomExists", {name: name})
                    logger.log("chatroom", `room ${name} already exists`, {extra: {socketId: socket.id}})
                    return;
                } else {
                    logger.log("chatroom", `room ${name} created`, {extra: {socketId: socket.id}})
                    const room = new ServerChatHandler(io, name, true);
                    this.rooms.set(room.roomName, room);
                    room.whenUserChanges((count) => {
                        this.broadcastRoomChange(io);
                    });
                    this.broadcastRoomChange(io);
                    socket.emit("roomCreated", {name: room.roomName});
                    this.listenToChatRoom(io, room);
                }
            },
            get: (data, socket, io) => {
                logger.log("chatroom", `room list requested`, {extra: {socketId: socket.id}, severity: -1});
                this.broadcastRoomChange(io);
                this.emitRooms(socket);
                socket.join(this.nameSpace);
            },
            leave: (data, socket, io) => {
                logger.log("chatroom", `room list not listened to anymore`, {
                    extra: {socketId: socket.id},
                    severity: -1
                });
                socket.leave(this.nameSpace);
            }
        });
    }

    emitRooms(socket: Socket) {
        let rooms = Array.from(this.rooms.values()).map(values => {
            return {
                name: values.roomName,
                userCount: values.userCount
            }
        });

        socket.emit("rooms", rooms);
    }
}
