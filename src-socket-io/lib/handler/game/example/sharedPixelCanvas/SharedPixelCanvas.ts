import type { z } from 'zod';
import type LobbyHandler from '../../../lobby/LobbyHandler';
import { type Color, ZSharedPixelCanvasEvents, ZSharedPixelCanvasSettings } from './types';
import type { PlayerInfo } from '../../../lobby/types';
import Player from '../../Player';
import BasicGame from '../../BasicGame';

export default class SharedPixelCanvas extends BasicGame<typeof ZSharedPixelCanvasEvents> {
	#width: number;
	#height: number;

	#pixels: Color[][];
	#players: Player[] = [];

	constructor(
		private lobbyHandler: LobbyHandler,
		private playersInfos: PlayerInfo[],
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
					return;
				}
			}
		);

		this.#width = this.settings.width;
		this.#height = this.settings.height;

		this.#pixels = [];
		for (let y = 0; y < this.#height; y++) {
			this.#pixels[y] = [];
			for (let x = 0; x < this.#width; x++) {
				this.#pixels[y][x] = { r: 255, g: 255, b: 255 };
			}
		}
	}

	emit(event: string, ...args: any[]) {
		this.lobbyHandler.namespace.to(this.name).emit(event, ...args);
	}

	get players() {
		if (this.#players.length === 0) {
			this.#players = this.playersInfos.map((playerInfo) => {
				return new Player(playerInfo, this.lobbyHandler.socketFrom(playerInfo));
			});
		}
		return this.#players;
	}

	pixelUpdate(x: number, y: number, color: Color) {
		this.#pixels[y][x] = color;
		this.emit('pixel-change', x, y, color);
	}
}
