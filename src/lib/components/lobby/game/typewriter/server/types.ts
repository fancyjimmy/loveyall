import { z } from 'zod';
import { createResponseSchema } from '../../../../../../../src-socket-io/lib/handler/lobby/types';

export type PlayerResult = { name: string; count: number };

/*

What events does Typeracer have?

type -> response
start -> throws error if already started
end -> response schema

 */

/*
ClientSide Events
on(progress, player: count);
on(start, word);
on(finish, score);
emit(progressing, chars);
emit(failing, chars);
 */

export const ZTypeRacerSettings = z.object({
	time: z
		.number()
		.min(30)
		.max(3 * 60)
});

export const ZTypeRacerEvents = z.object({
	start: createResponseSchema(z.void()),
	type: z.string(),
	end: createResponseSchema(z.void())
});
