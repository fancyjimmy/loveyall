<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import {GeneralLobbyInfo, Response} from "../../../../src-socket-io/lib/handler/lobby/manage/types";
    import {io} from "../../../lib/WebsocketConnection";

    const dispatch = createEventDispatcher();


    export let lobbyId;

    async function isPasswordAuthenticated() {
        return new Promise((resolve, reject) => {
            io.emit(
                'lobby:get',
                {lobbyId: lobbyId},
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
        lobbyId: string = lobbyId
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

</script>


