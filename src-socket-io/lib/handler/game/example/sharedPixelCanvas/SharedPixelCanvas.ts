import type { z } from 'zod';
import type LobbyHandler from '../../../lobby/LobbyHandler';
import { type Color, ZSharedPixelCanvasEvents, ZSharedPixelCanvasSettings } from './types';
import type Player from '../../../lobby/playerManager/Player';
import BasicGame from '../../BasicGame';

export default class SharedPixelCanvas extends BasicGame<typeof ZSharedPixelCanvasEvents> {
	#width: number;
	#height: number;

	#pixels: (Color | null)[][];

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
				},
				clear: (cb, player) => {
					this.clear();
					cb({ success: true });
				},
				fillPixel: ([x, y, width, height, color], player) => {
					this.pixelFill(x, y, width, height, color);
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

		this.fillCanvas(null);
	}

	get players(): Player[] {
		return this.#players;
	}

	fillCanvas(color: Color | null) {
		this.#pixels = [];
		for (let y = 0; y < this.#height; y++) {
			this.#pixels[y] = [];
			for (let x = 0; x < this.#width; x++) {
				this.#pixels[y][x] = color;
			}
		}
	}

	pixelUpdate(x: number, y: number, color: Color | null) {
		this.#pixels[y][x] = color;
		this.emit('pixel-change', x, y, color);
	}

	pixelFill(x: number, y: number, width: number, height: number, color: Color | null) {
		for (let startY = y; startY < y + height; startY++) {
			for (let startX = x; startX < x + width; startX++) {
				if (startY < 0 || startX < 0 || startY >= this.#height || startX >= this.#width) continue;
				this.#pixels[startY][startX] = color;
			}
		}
		this.emit('pixel-fill', x, y, width, height, color);
	}

	private clear() {
		this.pixelFill(0, 0, this.#width, this.#height, null);
	}
}
