<script lang="ts">
    import {onMount} from 'svelte';
    import {Socket} from 'socket.io-client';
    import {LOBBY_SESSION_KEY} from '$lib/constants';
    import {io} from '$lib/WebsocketConnection';
    import type {
        GeneralLobbyInfo,
        LobbySettings,
        Response
    } from '../../../../src-socket-io/lib/handler/lobby/manage/types';
    import {getLobbyConnection} from '../../../lib/lobby/LobbyConnection';
    import Chat from '$lib/components/chat/Chat.svelte';
    import ServerMessage from './ServerMessage.svelte';
    import Icon from '@iconify/svelte';
    import {dev} from '$app/environment';
    import type {GeneralPlayerInfo, PlayerInfo} from '../../../../src-socket-io/lib/handler/lobby/types';
    import type {JoinInfo} from '../../../../src-socket-io/lib/handler/lobby/LobbyHandler';

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
                (response: Response<Partial<GeneralLobbyInfo>>) => {
                    if (response.success === false) {
                        reject(response.message);
                        return;
                    }
                    if (response.data.authenticationPolicyType === 'password') {
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
            io.emit('lobby:join', {username, password, lobbyId}, (response: Response<string>) => {
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(response.message);
                }
            });
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

    async function loadData(socket: Socket): Promise<JoinInfo> {
        return new Promise<JoinInfo>((resolve, reject) => {
            socket.emit('joined', (data) => {
                resolve(data as JoinInfo);
            });

            socket.once('error', (data) => {
                reject(data);
            });
            setTimeout(() => {
                reject('timeout');
            }, 1000);
        });
    }

    let players: GeneralPlayerInfo[] = [];

    let self = {
        username: '',
        role: ''
    };

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
            error = 'Disconnected';
        });
    }

    let socket: Socket;
    let maxPlayers = 0;


    let error = null;
    onMount(async () => {
        io.on('error', (err) => {
            loadingState = 'error';
            error = err.message;
        });
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

        socket = getLobbyConnection(data.lobbyId, token);

        try {
            const initData: JoinInfo = await loadData(socket);
            lobbyName = initData.name;
            players = initData.players;
            self.username = initData.username;
            self.role = initData.role;
            lobbyId = initData.lobbyId;
            chatRoomId = initData.chatRoomId;
            maxPlayers = initData.maxPlayers;

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
    let lobbyName;
    let username = '';

    let link = window.location.href;
    let copied = false;

    function kick(player: GeneralPlayerInfo) {
        socket.emit('kick', player.username, (response: Response<null>) => {
            if (response.success === false) {
                alert(response.message);
            }
        });
    }

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
    <div class="w-full h-full">
        {#if loadingState === 'loading'}
            <div class="w-full h-full flex items-center justify-center bg-slate-900">
                <div>
                    <p class="text-white text-4xl">Loading</p>
                </div>
            </div>
        {:else if loadingState === 'error'}
            <div class="w-full h-full flex items-center justify-center bg-slate-900">
                <div class="bg-red-500 border-2 border-red-800 p-4 rounded text-white">
                    <p class="font-semibold text-3xl mb-3">{JSON.stringify(error)}</p>
                    <p class="text"><a href="/lobby">Look for another Lobby 👀</a></p>
                </div>
            </div>
        {:else}
            <div class="w-full h-full bg-slate-800 relative flex">
                <div class="flex-[3] flex flex-col">
                    <div class="flex-1 grid grid-cols-[15em,1fr]">
                        <div class="bg-slate-900 p-2">
                            <div class="bg-slate-600 rounded p-2 shadow">
                                <div class="rounded text-slate-100 pl-1">
                                    <div
                                            class="text-lg font-bold flex items-center justify-between gap-1"
                                    >
                                        {self.username}
                                        {#if self.role === 'host'}
											<span class="text-yellow-400">
												<Icon icon="ic:round-star"/>
											</span>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-2">
                                <h3 class="text-slate-400 text-xs font-bold">PLAYERS - {players.length - 1}</h3>
                                <div class="flex flex-col w-full">
                                    {#each players.filter((player) => player.username !== self.username) as player}
                                        <div class="rounded text-slate-100 pl-1">
                                            <div class="text-lg font-bold flex items-center justify-between gap-1">
                                                <p class="truncate">
                                                    {player.username}
                                                </p>
                                                {#if player.role === 'host'}
                                                    <div class="text-yellow-400 block">
                                                        <Icon icon="ic:round-star"/>
                                                    </div>
                                                {/if}

                                                {#if self.role === 'host'}
                                                    <button
                                                            class="text-slate-600 hover:text-red-500 duration-200"
                                                            on:click={() => {
														kick(player);
													}}
                                                    >
                                                        <Icon icon="mdi:trash-can"/>
                                                    </button>
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col">
                            <div class="text-2xl p-2 text-white font-bold flex justify-between items-center w-full bg-slate-700">
                                <h2>LOBBY {lobbyName} {players.length}/{maxPlayers}</h2>

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

                            <div class="flex-1">

                                <slot/>
                            </div>

                        </div>
                    </div>
                </div>

                <Chat
                        room={chatRoomId}
                        user={self.username}
                        class="flex-1 min-w-[20em]"
                        userComponent={null}
                        messageFormatter={(message) => {
						if (message.extra?.server === true) {
							return ServerMessage;
						}
					}}
                >
                    <p slot="icon"/>
                </Chat>
            </div>
        {/if}
    </div>
</div>
