import type { z } from 'zod';
import type LobbyHandler from '../../../lobby/LobbyHandler';
import { type Color, ZSharedPixelCanvasEvents, ZSharedPixelCanvasSettings } from './types';
import type Player from '../../../lobby/playerManager/Player';
import BasicGame from '../../BasicGame';

export default class SharedPixelCanvas extends BasicGame<typeof ZSharedPixelCanvasEvents> {
	#width: number;
	#height: number;

	#pixels: Color[][];

	#players: Player[] = [];

	emit(event: string, ...args: any[]) {
		this.lobbyHandler.namespace.to(this.name).emit(event, ...args);
	}

	constructor(
		private lobbyHandler: LobbyHandler,
		players: Player[],
		private settings: z.infer<typeof ZSharedPixelCanvasSettings>
	) {
		super(
			'pixel',
			ZSharedPixelCanvasEvents,
			{
				initialImage: (cb, player) => {
					cb(this.#pixels);
				},
				updatePixel: ([x, y, color], player) => {
					this.pixelUpdate(x, y, color);
				},
				end: (cb, player) => {
					if (!player.isHost) {
						cb({ success: false, message: 'Not Authorized' });
					}

					this.end();
				}
			},
			{
				disconnect: (player) => {
					return;
				},
				reconnect: (player) => {
					this.registerPlayer(player);
					return;
				}
			}
		);

		this.#players = players;

		this.#width = this.settings.width;
		this.#height = this.settings.height;
		this.#pixels = [];

		this.fillCanvas({ r: 255, g: 255, b: 255 });
	}

	get players(): Player[] {
		return this.#players;
	}

	fillCanvas(color: Color) {
		this.#pixels = [];
		for (let y = 0; y < this.#height; y++) {
			this.#pixels[y] = [];
			for (let x = 0; x < this.#width; x++) {
				this.#pixels[y][x] = color;
			}
		}
	}

	pixelUpdate(x: number, y: number, color: Color) {
		this.#pixels[y][x] = color;
		this.emit('pixel-change', x, y, color);
	}
}
