<script lang="ts">
    import {onMount} from 'svelte';
    import {Socket} from 'socket.io-client';
    import {LOBBY_SESSION_KEY} from '$lib/constants';
    import {io} from '$lib/WebsocketConnection';
    import type {
        LobbySettings,
        PlayerAuthenticationResponse,
        PlayerInfo,
        Response
    } from '../../../../src-socket-io/lib/lobby/types';
    import {getLobbyConnection} from '../../../lib/lobby/LobbyConnection';
    import Chat from "$lib/components/Chat.svelte";

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
    ): Promise<PlayerAuthenticationResponse> {
        return new Promise<PlayerAuthenticationResponse>((resolve, reject) => {
            io.emit(
                'lobby:join',
                {username, password, lobbyId},
                (response: Response<PlayerAuthenticationResponse>) => {
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        reject(response.message);
                    }
                }
            );
        });
    }

    async function join(): Promise<PlayerAuthenticationResponse> {
        let passwordAuthenticated = await isPasswordAuthenticated();

        let name = prompt('Please enter your name');
        let password = null;
        if (passwordAuthenticated) {
            password = prompt('Please enter your password');
        }
        try {
            let authResponse = await serverAuthentication(name, password);
            return authResponse;
        } catch (e) {
            throw e;
        }
    }

    async function loadData(socket: Socket) {
        return new Promise((resolve, reject) => {
            socket.emit('joined', (data) => {
                resolve(data);
            });

            socket.once("error", (data) => {
                reject(data);
            });
            setTimeout(() => {
                reject('timeout');
            }, 1000);
        });
    }

    async function rejoin(socket: Socket, sessionKey: string) {
        return new Promise((resolve, reject) => {
            socket.emit('rejoin', (data) => {
                resolve(data);
            });

            socket.once("error", (data) => {
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
    }

    function initSocketEvents(socket: Socket) {
        socket.on("playerChanged", (change) => {
            console.log(change);
            console.log("hi");
            setPlayerData(change.players);
        });

    }

    let error = null;
    onMount(async () => {
        let token = getSessionStorage("sessionKey");
        let rejoining = token !== null;
        if (!token) {
            try {
                let playerAuthenticationResponse = await join();
                setSessionStorage("sessionKey", playerAuthenticationResponse.sessionKey);
                token = playerAuthenticationResponse.sessionKey;
            } catch (e) {
                loadingState = 'error';
                error = e;
                return;
            }
        }

        let socket = getLobbyConnection(data.lobbyId, token);

        try {
            if (rejoining) {
                await rejoin(socket, token);
            }
            const initData = await loadData(socket);
            console.log(initData);
            players = initData.data.players;
            username = initData.data.username;
            role = initData.data.role;
            lobbySettings = initData.data.lobbyInfo.settings;

            initSocketEvents(socket);
            loadingState = 'success';
        } catch (e) {
            loadingState = 'error';
            error = e;
        }
    });

    let role = "";
    let lobbyId = "";
    let lobbySettings = null;

    let username = "";

    function copyLink() {
        navigator.clipboard.writeText(window.location.href);
    }

</script>

<div class="flex w-screen h-screen">
    <div class="flex-1">
        {#if loadingState === 'loading'}
            <p>Loading</p>
        {:else if loadingState === 'error'}
            <p>Lobby not Found</p>
            <p>{JSON.stringify(error)}</p>
            <p><a href="/lobby">Create</a></p>
        {:else}
            <div>
                <p>{username}</p>
                <p>{role}</p>
                <button class="bg-yellow-200" on:click={copyLink}>
                    <p>{data.lobbyId}</p>

                </button>
                <p>{JSON.stringify(lobbySettings)}</p>
                <p>Players</p>
                <div class="flex">

                    {#each players.filter(player => player.username !== username) as player}
                        <div class="bg-red-200">
                            <p>{player.username}</p>
                            <p>{player.role}</p>
                            <p>{player.joinedTime}</p>
                        </div>
                    {/each}
                </div>
            </div>

        {/if}
    </div>

    <div class="flex-1">
        {#if loadingState === "success"}
            <Chat room="general" user={username} class="h-full w-full"></Chat>
        {/if}
    </div>

</div>

