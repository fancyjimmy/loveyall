<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import type {FormType} from "./FormTypes";

    const dispatch = createEventDispatcher();

    export let resolve: (...args: any[]) => void;


    let testFormType: FormType = [
        {
            name: "hello",
            type: "string",
            constraints: {
                required: true,
                default: 2,
                value: {
                    minLength: 5,
                    maxLength: 10
                }
            }
        }

    ]
    let doStuff = () => {
        resolve(pass, poss);
    }
    let pass;
    let poss;
</script>

<div>

    <input bind:value={poss} type="text">
    <input bind:value={pass} type="text">
    <button on:click={doStuff}>
        Clock
    </button>
</div>
