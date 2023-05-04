import ioClient from 'socket.io-client';

let socket;

try {
	socket = ioClient('/');
} catch (error) {
	alert('Error connecting to server. Please try again later.');
	console.error(error);
}

export const io = socket;

// https://contacts-d6169-default-rtdb.europe-west1.firebasedatabase.app/name.json
