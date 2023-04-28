<script lang="ts">
    import Icon from '@iconify/svelte';
    import {createEventDispatcher} from 'svelte';

    export let players = [];
    export let self: { username: string, role: string } = {};
    const dispatch = createEventDispatcher();
</script>

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
								dispatch('kick', player);
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
