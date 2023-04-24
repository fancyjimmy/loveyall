<script lang="ts">
    import {afterUpdate, beforeUpdate, onMount} from 'svelte';
    import {io} from '../../WebsocketConnection';
    import {tooltip} from '$lib/util';
    import FlyingWindow from '$lib/components/debug/FlyingWindow.svelte';

    type ConsoleMessage = {
        type: string | symbol;
        time: Date;
        args: any[];
    };
    let logs: ConsoleMessage[] = [];

    onMount(() => {
        io.emit('debug:listen');
        io.on('console', (type: string | symbol, time: Date, ...args: any[]) => {
            logs = [...logs, {type, time, args: args}];
        });

        return () => {
            io.emit('debug:unListen');
        };
    });

    let consoleElement;
    let autoscroll;

    let scrollThreshold = 20;
    beforeUpdate(() => {
        if (showing) {
            autoscroll =
                consoleElement &&
                consoleElement.offsetHeight + consoleElement.scrollTop >
                consoleElement.scrollHeight - scrollThreshold;
        }
    });

    afterUpdate(() => {
        if (showing) {
            if (autoscroll) consoleElement.scrollTo(0, consoleElement.scrollHeight);
        }
    });
    let command = '';

    let usedCommands: string[] = [];

    function runCommand(cmd: string) {
        if (cmd.trim() === "") {
            return;
        }
        usedCommands.push(cmd);
        currentLastCommand = 0;
        if (cmd === 'clear' || cmd === 'cls') {
            logs = [];
            command = '';
            return;
        }
        logs = [...logs, {type: 'cmd', time: new Date(), args: [cmd]}];
        io.emit('debug:run', {command: cmd, runDangerously: true});
        command = '';
    }

    let minified = false;
    let closed = false;

    $: showing = !(minified || closed);

    function minify() {
        minified = !minified;
        maximized = false;
    }

    let maximized;

    function maximize() {
        maximized = !maximized;
        minified = false;
    }

    function close() {
        closed = true;
        minified = false;
        maximized = false;
    }

    function show() {
        closed = false;
        minified = false;
        maximized = false;
    }

    function lastUsed(i: number) {
        currentLastCommand = Math.min(Math.max(usedCommands.length - 1 - i, 0), usedCommands.length - 1);
        return usedCommands[currentLastCommand];
    }

    let currentLastCommand = 0;

    function setCommand(cmd: string) {
        command = cmd;
    }
</script>

<FlyingWindow class="shadow-lg {closed ? 'top-5 right-5' : ''}" moveAble={!maximized && !closed} x={600}>
    {#if !closed}
        <div
                class="rounded-lg bg-black text-white font-mono top-0 left-0 w-96 duration-200 {minified
				? 'h-min'
				: 'h-96'} z-[5] flex flex-col overflow-hidden cursor-default m-0"
                class:full-screen={maximized}
        >
            <div class="bg-gray-800 relative flex justify-center">
                <div class="flex absolute left-2 top-0 bottom-0 my-auto items-center gap-1">
                    <button
                            class="rounded-full h-4 w-4 bg-red-500 border border-red-800"
                            on:click={() => {
                            close()
						}}
                    />
                    <button
                            class="rounded-full h-4 w-4 bg-yellow-500 border border-yellow-800"
                            on:click={() => {
							minify();
						}}
                    />
                    <button
                            class="rounded-full h-4 w-4 bg-green-500 border border-green-800"
                            on:click={() => {
							maximize();
						}}
                    />
                </div>
                <p class="text-white font-semibold">debug cmd</p>
            </div>
            {#if !minified}
                <div bind:this={consoleElement} class="flex-1 overflow-scroll scrollbar-hidden p-2">
                    {#each logs as log}
                        {#if log.type === 'cmd'}
                            <div>
                                >{log.args[0]}
                            </div>
                        {:else}
                            <div class="flex gap-1">
                                <span class="text-lime-500" use:tooltip title={log.time}>[{log.type}]</span>
                                <p class="whitespace-nowrap">
                                    { @html log.args.map((element) => JSON.stringify(element).replaceAll("\\n", "<br>").replaceAll('\\\"', '')).join(" ")}
                                </p>
                            </div>
                        {/if}
                    {/each}
                </div>
                <div class="w-full flex items-center">
                    <p>&gt;&gt;</p>
                    <input
                            type="text"
                            class="text-white w-full focus:outline-0 rounded p-2 flex-1 bg-transparent"
                            bind:value={command}
                            on:keydown={(event) => {
                            if (event.key === "ArrowUp"){
                                setCommand(lastUsed(currentLastCommand));
                                currentLastCommand++;
                            }
                            if (event.key === "ArrowDown"){
                                setCommand(lastUsed(currentLastCommand));
                                currentLastCommand--;
                            }
							if (event.key === 'Enter') {
								runCommand(command);
							}
						}}
                    />
                </div>
            {/if}
        </div>
    {:else}
        <button
                class="rounded-full h-6 w-6 bg-sky-500"
                on:click={() => {
                    show()
						}}></button>
    {/if}
</FlyingWindow>

<style>
    .full-screen {
        @apply w-screen h-screen top-0 left-0 rounded-none;
    }
</style>
