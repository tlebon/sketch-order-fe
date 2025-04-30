<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const { sketch } = $props<{
    sketch: {
      id: string;
      title: string;
      description: string;
      duration: number;
      cast: string[];
      chars: number;
      casted: number;
      locked: boolean;
    };
  }>();

  const dispatch = createEventDispatcher();

  function handleClose(event: MouseEvent) {
    event.stopPropagation();
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose(event);
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

<div
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  on:click={handleClose}
>
  <div
    class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    on:click|stopPropagation
  >
    <div class="p-6">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-2xl font-bold text-gray-900">{sketch.title}</h2>
        <button
          type="button"
          on:click={handleClose}
          class="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close details"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Description</h3>
          <p class="text-gray-600">{sketch.description}</p>
        </div>

        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Duration</h3>
          <p class="text-gray-600">{sketch.duration} minutes</p>
        </div>

        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Cast Members</h3>
          <div class="flex flex-wrap gap-2">
            {#each sketch.cast as member}
              <span class="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {member}
              </span>
            {/each}
          </div>
        </div>

        <div class="flex gap-4 text-sm text-gray-500">
          <span>Characters: {sketch.chars}</span>
          <span>Casted: {sketch.casted}</span>
        </div>
      </div>
    </div>
  </div>
</div> 