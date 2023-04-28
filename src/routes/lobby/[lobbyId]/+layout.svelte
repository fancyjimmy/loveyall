<script lang="ts">
    import {onMount, SvelteComponent} from 'svelte';
    import {Socket} from 'socket.io-client';
    import {io} from '$lib/WebsocketConnection';
    import type {GeneralLobbyInfo, Response} from '../../../../src-socket-io/lib/handler/lobby/manage/types';
    import {getLobbyConnection, getSessionStorage, setSessionStorage} from '../../../lib/lobby/LobbyConnection';
    import Chat from '$lib/components/chat/Chat.svelte';
    import ServerMessage from './ServerMessage.svelte';
    import Icon from '@iconify/svelte';
    import {dev} from '$app/environment';
    import type {GeneralPlayerInfo, PlayerInfo} from '../../../../src-socket-io/lib/handler/lobby/types';
    import type {JoinInfo} from '../../../../src-socket-io/lib/handler/lobby/LobbyHandler';
    import PlayerListComponent from "./PlayerListComponent.svelte";
    import Dialog from "$lib/components/lobby/Dialog.svelte";
    import LoadingScreen from "./LoadingScreen.svelte";
    import ErrorScreen from "./ErrorScreen.svelte";

    export let data;

    let loadingState: 'loading' | 'error' | 'success' = 'loading';


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

        playerInfos.forEach((player) => {
            if (player.username === self.username) {
                self = {
                    username: player.username,
                    role: player.role
                };
            }
        });

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
            self = {
                username: initData.username,
                role: initData.role
            };
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

    let lobbyId = '';
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
    let dialog;
    let dialogComponent: SvelteComponent;
    let dialogArgs: any = {};

    let onResolve: (...args: any) => void;

    async function openDialog(element: SvelteComponent, args: any, resolveCallback: (...args: any) => void): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            dialogComponent = element;
            dialogArgs = args;
            onResolve = (...args: any[]) => {
                resolveCallback(...args);
                resolve(args);
            };
            dialog.open();
        });
    }
</script>

<div class="w-screen h-screen">
    <div class="w-full h-full">
        {#if loadingState === 'loading'}
            <LoadingScreen/>
        {:else if loadingState === 'error'}
            <ErrorScreen {error}></ErrorScreen>
        {:else}
            <div class="w-full h-full bg-slate-800 relative flex">
                <div class="flex-[3] flex flex-col">
                    <div class="flex-1 grid grid-cols-1 relative">
                        <div class="flex flex-col">
                            <div class="text-2xl p-2 text-white font-bold flex justify-between items-center w-full">
                                <h2>{lobbyName} <span class="text-xs text-slate-400">{players.length}
                                    /{maxPlayers}</span></h2>

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

                <div class="flex-1 flex flex-col">
                    <div class="bg-slate-800 p-2 top-2 left-2 w-full h-48 overflow-y-auto scrollbar-hidden">

                        <PlayerListComponent players={players} {self}
                                             on:kick={(event) => {kick(event.detail)}}/>
                    </div>

                    <Chat
                            room={chatRoomId}
                            user={self.username}
                            class="flex-1 min-w-[25em]"
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

            </div>
        {/if}
    </div>
</div>

<Dialog args={dialogArgs} bind:this={dialog} element={dialogComponent} on:resolve={(event) => {
    onResolve(event.detail);
    dialog.close();
}}/>
