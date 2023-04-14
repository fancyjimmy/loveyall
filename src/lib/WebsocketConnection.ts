import ioClient from 'socket.io-client';
import {PUBLIC_SERVER_URL} from '$env/static/public';


const ENDPOINT = PUBLIC_SERVER_URL || 'http://localhost:5173;';

let socket;

try {
    socket = ioClient(ENDPOINT);
} catch (error) {
    alert('Error connecting to server. Please try again later.')
    console.error(error);
}

export const io = socket;


// https://contacts-d6169-default-rtdb.europe-west1.firebasedatabase.app/name.json