import { z } from 'zod';

export const ZColor = z.object({
	r: z.number().min(0).max(255),
	g: z.number().min(0).max(255),
	b: z.number().min(0).max(255)
});

export const ZSharedPixelCanvasEvents = z.object({
	initialImage: z
		.function()
		.args(z.array(z.array(ZColor)))
		.returns(z.void()),
	updatePixel: z.tuple([z.number(), z.number(), ZColor])
});

export const ZSharedPixelCanvasSettings = z.object({
	width: z.number().min(1).max(200),
	height: z.number().min(1).max(200)
});

export type Color = z.infer<typeof ZColor>;

export type SharedPixelCanvasSettings = z.infer<typeof ZSharedPixelCanvasSettings>;
