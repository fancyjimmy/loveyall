import ioClient, {Socket} from 'socket.io-client';

const ENDPOINT = 'http://192.168.1.104:5173/';

const socket = ioClient(ENDPOINT);

export const io: Socket = socket;