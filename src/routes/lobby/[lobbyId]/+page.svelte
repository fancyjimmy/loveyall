<script lang="ts">
    import {onMount} from 'svelte';
    import {Socket} from 'socket.io-client';
    import {LOBBY_SESSION_KEY} from '$lib/constants';
    import {io} from '$lib/WebsocketConnection';
    import type {LobbySettings, Response} from '../../../../src-socket-io/lib/handler/lobby/manage/types';
    import {getLobbyConnection} from '../../../lib/lobby/LobbyConnection';
    import Chat from '$lib/components/chat/Chat.svelte';
    import ServerMessage from './ServerMessage.svelte';
    import Icon from '@iconify/svelte';
    import {dev} from '$app/environment';
    import type {PlayerInfo} from "../../../../src-socket-io/lib/handler/lobby/types";

    export let data;

    let loadingState: 'loading' | 'error' | 'success' = 'loading';

    function setSessionStorage(key: string, value: string) {
        sessionStorage.setItem(`${LOBBY_SESSION_KEY}${data.lobbyId}${key}`, value);
    }

    function getSessionStorage(key: string): string | null {
        return sessionStorage.getItem(`${LOBBY_SESSION_KEY}${data.lobbyId}${key}`);
    }

    async function isPasswordAuthenticated() {
        return new Promise((resolve, reject) => {
            io.emit(
                'lobby:get',
                {lobbyId: data.lobbyId},
                (response: Response<Partial<LobbySettings>>) => {
                    if (response.success === false) {
                        reject(response.message);
                        return;
                    }
                    if (response.data.isPrivate) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            );
        });
    }

    async function serverAuthentication(
        username: string,
        password: string,
        lobbyId: string = data.lobbyId
    ): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            io.emit(
                'lobby:join',
                {username, password, lobbyId},
                (response: Response<string>) => {
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        reject(response.message);
                    }
                }
            );
        });
    }

    async function join(): Promise<string> {
        let passwordAuthenticated = await isPasswordAuthenticated();

        let name;
        while (!name) {
            name = prompt('Please enter your name');
        }
        let password = null;
        if (passwordAuthenticated) {
            password = prompt('Please enter your password');
        }
        try {
            return await serverAuthentication(name, password);
        } catch (e) {
            throw e;
        }
    }

    async function loadData(socket: Socket) {
        return new Promise((resolve, reject) => {
            socket.emit('joined', (data) => {
                resolve(data);
            });

            socket.once('error', (data) => {
                reject(data);
            });
            setTimeout(() => {
                reject('timeout');
            }, 1000);
        });
    }


    let players: PlayerInfo[] = [];

    async function setPlayerData(playerInfos: PlayerInfo[]) {
        players = playerInfos;

        for (let i = 0; i < players.length; i++) {
            if (players[i].username === username) {
                role = players[i].role;
                break;
            }
        }
    }

    function initSocketEvents(socket: Socket) {
        socket.on('playerChanged', (change) => {
            setPlayerData(change.players);
        });

        socket.on('disconnect', () => {
            loadingState = 'error';
            error = 'Lobby closed';
        });
    }

    let error = null;
    onMount(async () => {
        let token = getSessionStorage('sessionKey');
        if (!token) {
            try {
                let authToken = await join();
                setSessionStorage('sessionKey', authToken);
                token = authToken;
            } catch (e) {
                loadingState = 'error';
                error = e;
                return;
            }
        }

        let socket = getLobbyConnection(data.lobbyId, token);


        try {
            const initData = await loadData(socket);
            players = initData.players;
            username = initData.username;
            role = initData.role;
            lobbyId = initData.lobbyId;
            chatRoomId = initData.chatRoomId;

            initSocketEvents(socket);
            loadingState = 'success';
        } catch (e) {
            loadingState = 'error';
            error = e;
        }
    });

    let role = '';
    let lobbyId = '';
    let lobbySettings: LobbySettings | null = null;

    let username = '';

    let link = window.location.href;
    let copied = false;

    function copyLink() {
        if (copied) return;
        navigator.clipboard.writeText(link);
        copied = true;
        setTimeout(() => {
            copied = false;
        }, 1000);
    }

    let chatRoomId;
</script>

<div class="w-screen h-screen">
    <div>
        {#if loadingState === 'loading'}
            <div class="w-full h-full flex items-center justify-center bg-slate-900">
                <div>
                    <p>Loading</p>
                </div>
            </div>
        {:else if loadingState === 'error'}
            <p>Lobby not Found</p>
            <p>{JSON.stringify(error)}</p>
            <p><a href="/lobby">Create</a></p>
        {:else}
            <div class="w-full h-screen bg-slate-800 relative flex ">
                <div class="flex-[2]">
                    <div class="text-5xl font-semibold inline-flex text-white justify-between w-full">
					<span class="inline-flex items-center gap-3">
						{username}
                        {#if role === 'host'}
							<span class="text-yellow-400">
								<Icon icon="ic:round-star"/>
							</span>
						{/if}
					</span>
                        <div class="flex items-center">
                            {#if dev}
                                <!-- TODO Remove when prod -->
                                <a
                                        class="text-4xl p-2 hover:bg-slate text-lime-600 duration-200"
                                        href={link}
                                        target="_blank"
                                >
                                    <Icon icon="material-symbols:add"/>
                                </a>
                            {/if}

                            <button
                                    class="text-4xl p-2 hover:bg-slate {copied
								? 'text-sky-500'
								: 'text-white'} duration-200"
                                    on:click={copyLink}
                            >
                                <Icon icon="material-symbols:content-copy"/>
                            </button>
                        </div>
                    </div>
                    <h3 class="text-3xl text-white font-semibold">Players</h3>
                    <div class="flex gap-2 mt-2">
                        {#each players.filter((player) => player.username !== username) as player}
                            <div class="bg-slate-400 rounded p-3">
							<span class="text-xl inline-flex items-center gap-1">
								{player.username}
                                {#if player.role === 'host'}
									<span class="text-yellow-400">
										<Icon icon="ic:round-star"/>
									</span>
								{/if}
							</span>
                                <p>{player.joinedTime}</p>
                            </div>
                        {/each}
                    </div>
                </div>

                <Chat
                        room={chatRoomId}
                        user={username}
                        class="flex-1 min-w-[25em]"
                        userComponent={null}
                        messageFormatter={(message) => {
					if (message.extra?.server === true) {
						return ServerMessage;
					}
				}}
                >
                    <p slot="icon">Chat</p>
                </Chat>
            </div>
        {/if}
    </div>
</div>
