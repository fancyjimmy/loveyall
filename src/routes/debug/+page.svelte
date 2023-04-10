<script lang="ts">
    import Icon from '@iconify/svelte';
    import {io} from '../../lib/WebsocketConnection';
    import {afterUpdate, beforeUpdate, onMount} from 'svelte';
    import {dev} from '$app/environment';

    let url = '/general';
    let numberOfFrames = '3';

    let realUrl = '';
    let realNumberOfFrames = 0;

    let didGo = true;

    let textfield = '';
    let log = [];

    if (dev) {
        onMount(() => {
            io.on('debug', (data) => {
                log = data;
            });

            io.on("debugError", (data) => {
                alert(data);
            })

            io.on("debugUpdate", (data) => {
                log = [...log, data];
            })
        });
    }

    function go() {
        didGo = false;
        realUrl = url;
        realNumberOfFrames = parseInt(numberOfFrames);
    }

    function askDebug() {
        io.emit('debug:get', textfield.trim());
        textfield = '';
    }

    function stringify(message) {
        switch (typeof message) {
            case 'string':
                return message;
            case 'object': {
                if (message === null) {
                    return 'null';
                }
                if (message instanceof Array) {
                    return `[${message.map(stringify).join(', ')}]`;
                }
                return JSON.stringify(message);
            }
            default:
                return message;
        }
    }

    let output;
    let autoscroll;

    beforeUpdate(() => {
        autoscroll = output && (output.offsetHeight + output.scrollTop) > (output.scrollHeight - 20);
    });

    afterUpdate(() => {
        if (autoscroll) output.scrollTo(0, output.scrollHeight);
    });
</script>

{#if dev}
    <div class="relative flex flex-col bg-slate-600" style="height: 100vh; width: 100vw;">
        {#if didGo}
            <div class="absolute left-0 right-0 top-0 mx-0">
                <div>
                    <input
                            class="text-slate-300 px-2 rounded bg-slate-800 duration-200 border border-slate-700 focus:outline-0"
                            type="number"
                            bind:value={numberOfFrames}
                    />
                    <input
                            class="text-slate-300 px-2 rounded bg-slate-800 duration-200 border border-slate-700 focus:outline-0"
                            type="text"
                            bind:value={url}
                    />
                    <button on:click={go}>Go</button>
                </div>
            </div>
        {/if}

        <div class="w-full flex flex-1">
            {#if !didGo}
                {#each Array.from({length: realNumberOfFrames}) as _, i}
                    <div class="h-full flex-1">
                        <iframe src={realUrl} class="h-full w-full" style="margin: 0;"/>
                    </div>
                {/each}
            {/if}
        </div>

        <div class="w-full p-3">
            <div class="h-48">
                <ul class="h-full w-full overflow-y-auto flex flex-col gap-1" bind:this={output}>
                    {#each log as message, i}
                        <li class="{i % 2 == 0 ? 'bg-slate-500' : 'bg-slate-400'} rounded">
                            <details class="flex flex-col">
                                <summary>
                                    <code
                                    >{message.type}[{new Date(
                                        message.time
                                    ).toLocaleTimeString()}]: {message.message}</code
                                    >
                                </summary>
                                <div class="overflow-scroll">
                                    <pre>{JSON.stringify(message.options, null, 4)}</pre>
                                </div>
                            </details>
                        </li>
                    {/each}
                </ul>
            </div>
            <div class="flex gap-3">
                <input
                        class="text-slate-300 flex-1 px-2 rounded bg-slate-800 duration-200 border border-slate-700 focus:outline-0"
                        spellcheck="false"
                        placeholder="Write something..."
                        type="text"
                        bind:value={textfield}
                        on:keydown={(event) => {
						if (event.key === 'Enter') {
							askDebug();
						}
					}}
                />
                <button
                        class="hover:scale-110 duration-200 p-3 text-sky-500 text-2xl grid justify-center rounded"
                        on:click={askDebug}
                >
                    <Icon icon="ic:round-send"/>
                </button>
            </div>
        </div>
    </div>
{:else}
    <p>Fuuuuuuckk this shouldn't be here. only in dev...</p>
{/if}

<style>
    details summary::-webkit-details-marker {
        display: none;
    }
</style>
