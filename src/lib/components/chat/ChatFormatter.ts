import type {SvelteComponent} from "svelte";

export type Message = {
    message: string;
    user: string;
    time: number;
    self?: boolean;
    id: number;
    extra?: any;

}
export type MessageFormatter = (message: Message) => SvelteComponent | null;