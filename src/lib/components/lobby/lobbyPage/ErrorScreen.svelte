<script>
    export let error;
</script>

<div class="w-full h-full flex items-center justify-center bg-slate-900">
    <div class="bg-red-500 border-2 border-red-800 p-4 rounded text-white">
        <p class="text-white">Error</p>
        <p class="font-semibold text-3xl mb-3">{JSON.stringify(error)}</p>
        <p class="text"><a href="/lobby">Look for another Lobby 👀</a></p>
    </div>
</div>