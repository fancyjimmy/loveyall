import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;
export const csr = true;
export const load: LayoutLoad = async ({ params }) => {
	return {
		lobbyId: params.lobbyId
	};
};
