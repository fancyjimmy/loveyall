import {ServerHandler} from "../socket/ServerHandler";
import type {Server, Socket} from "socket.io";
import {logger} from "../Logging";

type ChatHandler = {
    join: {
        name: string;
    },
    leave: null,
    message: {
        message: string;
    },
    disconnect: null
}

type ChatRoomHandler = {
    create: {
        name: string;
    },
    get: null,
    leave: null,
}

export class ServerChatRoomHandler extends ServerHandler<ChatRoomHandler> {
    rooms = new Map<string, ServerChatHandler>();


    listenToChatRoom(io: Server, room: ServerChatHandler) {
        const listener = (socket: Socket) => {
            room.registerSocket(io, socket);
        };

        // new Sockets are automatically able to join the new room
        io.on("connection", listener);

        // old sockets are able to join the new room
        room.registerForEverySocket(io);

        room.whenClosing(() => {
            logger.log("chatroom", `room ${room.roomName} was closed`)
            this.rooms.delete(room.roomName);
            // new Sockets are not able to join the new room
            io.off("connection", listener);
            // old sockets are not able to join the new room
            io.sockets.sockets.forEach(socket => room.unregister(socket));
            this.broadcastRoomChange(io);
        });
    }

    broadcastRoomChange(io: Server) {
        io.to(this.nameSpace).emit("rooms", Array.from(this.rooms.keys()));
    }

    constructor() {
        super("chatRoom", {
            create: ({name}, socket, io) => {
                if (this.rooms.has(name)) {
                    logger.log("chatroom", `room ${name} already exists`, {extra: {socketId: socket.id}})
                    return;
                } else {
                    logger.log("chatroom", `room ${name} created`, {extra: {socketId: socket.id}})
                    const room = new ServerChatHandler(name, true);
                    this.rooms.set(room.roomName, room);
                    this.broadcastRoomChange(io);
                    this.listenToChatRoom(io, room);
                }
            },
            get: (data, socket, io) => {
                logger.log("chatroom", `room list requested`, {extra: {socketId: socket.id}, severity: -1});
                socket.emit("rooms", Array.from(this.rooms.keys()));
                this.broadcastRoomChange(io);
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
}

const adjectives = [
    'Happy', 'Sad', 'Brave', 'Silly', 'Clever', 'Creative', 'Curious', 'Eager', 'Faithful',
    'Fancy', 'Fierce', 'Friendly', 'Funny', 'Generous', 'Gentle', 'Grateful', 'Great', 'Happy',
    'Helpful', 'Honest', 'Humorous', 'Innocent', 'Intelligent', 'Jolly', 'Joyful', 'Kind',
    'Lovely', 'Lucky', 'Magical', 'Merry', 'Mighty', 'Modest', 'Neat', 'Nifty', 'Noble',
    'Optimistic', 'Outgoing', 'Patient', 'Peaceful', 'Perfect', 'Polite', 'Proud', 'Quirky',
    'Quick', 'Quiet', 'Radiant', 'Rational', 'Reliable', 'Respectful', 'Romantic', 'Sassy',
    'Savvy', 'Scholarly', 'Selfless', 'Sensible', 'Silly', 'Sincere', 'Skilled', 'Smart',
    'Smooth', 'Social', 'Spirited', 'Sporty', 'Strong', 'Stunning', 'Super', 'Sweet', 'Talented',
    'Thoughtful', 'Thrifty', 'Tidy', 'Tough', 'Trustworthy', 'Upbeat', 'Valiant', 'Vibrant',
    'Victorious', 'Vigorous', 'Virtuous', 'Vital', 'Warm', 'Willing', 'Wise', 'Witty', 'Wonderful',
    'Worthy', 'Young', 'Zealous'
];

const nouns = [
    'Dog', 'Cat', 'Bird', 'Tree', 'House', 'Car', 'Bike', 'Boat', 'Bridge', 'Book', 'Chair',
    'City', 'Computer', 'Cookie', 'Country', 'Desk', 'Doctor', 'Door', 'Dream', 'Earth',
    'Engineer', 'Flower', 'Friend', 'Fruit', 'Garden', 'Guitar', 'Hat', 'Heart', 'Horse',
    'Island', 'Jacket', 'Key', 'Kitten', 'Laptop', 'Lawyer', 'Leaf', 'Library', 'Light',
    'Love', 'Man', 'Memory', 'Money', 'Moon', 'Mountain', 'Music', 'Ocean', 'Office', 'Painting',
    'Piano', 'Pizza', 'Planet', 'Queen', 'Rabbit', 'Rain', 'River', 'Rock', 'Room', 'Sandwich',
    'Sea', 'Ship', 'Shoe', 'Sky', 'Smile', 'Snow', 'Song', 'Soul', 'Star', 'Sun', 'Teacher',
    'Time', 'Train', 'Tree', 'Water', 'Wave', 'Woman', 'World', 'Yoga', 'Zebra', 'Zoo'
];

export class ServerChatHandler extends ServerHandler<ChatHandler> {
    // socket.id -> name
    private userSockets = new Map<string, string>();

    private counter = 0;

    constructor(public readonly roomName: string = "general", private temporary: boolean = false, private timeOutTime: number = 5 * 1000) {
        super(`chat:${roomName}`, {
            join: ({name}, socket, io) => {
                logger.log("chat", `${socket.id} tried to join room ${this.roomName}`, {severity: -1});
                // if (roomName !== this.roomName) {
                //     return;
                // }
                // user already in room

                if (this.userSockets.has(socket.id)) {
                    logger.log("chat", `${name} tried to join room ${this.roomName} but he is already in it`);
                    return;
                }


                if (this.userNameTaken(name)) {
                    this.setClientName(socket, this.generateRandomUserName());
                } else {
                    this.setClientName(socket, name);
                }
            },
            leave: (data, socket, io) => {
                this.leaveRoom(socket);
            },
            message: (data, socket, io) => {
                if (!this.userExists(socket)) {
                    this.setClientName(socket, this.generateRandomUserName());
                }
                this.sendMessage(socket, data.message);
            },
            disconnect: (data, socket, io) => {
                this.leaveRoom(socket);
            }
        });

        if (temporary) {
            // if it is temporary and somebody created it, but didn't join it, it will be deleted after 1 minute
            setTimeout(() => {
                if (this.userSockets.size === 0) {
                    logger.log("chatroom", `room ${this.roomName} was closed because it was temporary and nobody even joined`);
                    this.closeCallback();
                }
            }, this.timeOutTime);
        }
    }

    private closeCallback = () => {
    };

    whenClosing(callback: () => void) {
        this.closeCallback = callback;
    }

    generateRandomUserName(): string {
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

        return `${randomAdjective}${randomNoun}`;
    }

    joinRoom(socket: Socket) {
        socket.join(this.nameSpace);
    }

    leaveRoom(socket: Socket) {
        const user = this.getUser(socket);
        if (user) {
            logger.log("chat", `${user} left room ${this.roomName}`);
        }
        socket.leave(this.nameSpace);
        this.userSockets.delete(socket.id);
        this.emitUsers(socket);
        if (this.userSockets.size === 0 && this.temporary) {
            this.closeCallback();
            logger.log("chatroom", `room ${this.roomName} was closed because it was temporary and everybody left`, {extra: {socketId: socket.id}});
        }
    }

    getClientUsers() {
        return Array.from(this.userSockets.values()).map((name, index) => ({
            name,
            index
        }))
    }

    setClientName(socket: Socket, name: string) {
        this.joinRoom(socket);
        socket.emit("name", name);
        socket.emit("users", this.getClientUsers());
        this.userSockets.set(socket.id, name);
        this.emitUsers(socket);
        logger.log("chat", `${name} joined room ${this.roomName}`, {extra: {socketId: socket.id}});
    }

    userNameTaken(name: string) {
        return Array.from(this.userSockets.values()).includes(name);
    }

    userExists(socket: Socket) {
        return this.userSockets.has(socket.id);
    }

    emitUsers(socket: Socket) {
        socket.to(this.nameSpace).emit("users", this.getClientUsers());
    }

    getUser(socket: Socket) {
        return this.userSockets.get(socket.id);
    }

    sendMessage(socket: Socket, message: string) {
        const user = this.getUser(socket);
        socket.to(this.nameSpace).emit("message", {message, user, time: Date.now(), id: this.counter++});
        logger.log("chat", `${user} sent message in room ${this.roomName}: ${message}`, {extra: {socketId: socket.id}});
    }

}