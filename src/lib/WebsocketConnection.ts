import ioClient, {Socket} from 'socket.io-client';

const ENDPOINT = 'http://10.117.237.84:5173/';

const socket = ioClient(ENDPOINT);

export const io: Socket = socket;