<script lang="ts">

    import type {Socket} from "socket.io-client";

    export let name: string;
    export let socket: Socket;

</script>


<p>
    {#each name.toUpperCase().split('') as char, i}
        <span class="bounce inline-block" style="--delay: {i * 80}ms">{char}</span>
    {/each}
</p>

<p>Wait for initializing to finish</p>


<style>
    @keyframes bounce {
        0% {
            transform: translateY(0);
        }
        30% {
            transform: translateY(-20px);
        }
        60% {
            transform: translateY(0);
        }
        100% {
            transform: translateY(0);
        }
    }

    .bounce {
        --delay: 0s;
        animation: bounce 1s infinite ease-in-out;
        animation-delay: var(--delay);
    }
</style>
