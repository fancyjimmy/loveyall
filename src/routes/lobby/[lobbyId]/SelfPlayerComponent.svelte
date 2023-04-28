<script lang="ts">
    import Icon from '@iconify/svelte';

    export let self: {
        username: string;
        role: string;
    } = {};
</script>

<div class="bg-slate-600 rounded p-2 shadow">
    <div class="rounded text-slate-100 pl-1">
        <div class="text-lg font-bold flex items-center justify-between gap-1">
            {self.username}
            {#if self.role === 'host'}
				<span class="text-yellow-400">
					<Icon icon="ic:round-star"/>
				</span>
            {/if}
        </div>
    </div>
</div>
