import {sveltekit} from '@sveltejs/kit/vite';
import {webSocketServer} from './websocketPluginVite';

/** @type {import('vite').UserConfig} */
const config = {
	server: {
		port: 5173
	},
	preview: {
		port: 80
	},
	plugins: [sveltekit(), webSocketServer]
};

export default config;
