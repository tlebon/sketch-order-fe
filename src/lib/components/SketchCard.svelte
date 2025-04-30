<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let sketch: {
    id: string;
    title: string;
    description: string;
    duration: number;
    cast: string[];
    chars: number;
    casted: number;
    locked: boolean;
  };

  const dispatch = createEventDispatcher();
  let isEditing = false;
  let editedTitle = sketch.title;
  let editedDescription = sketch.description;
  let editedDuration = sketch.duration;
  let editedCast = sketch.cast.join(', ');

  function toggleLock(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    dispatch('toggleLock', { id: sketch.id });
  }

  function handleEdit(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    isEditing = true;
  }

  function handleSave(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    const updatedSketch = {
      ...sketch,
      title: editedTitle,
      description: editedDescription,
      duration: editedDuration,
      cast: editedCast.split(',').map(name => name.trim()).filter(Boolean)
    };
    dispatch('update', updatedSketch);
    isEditing = false;
  }

  function handleCancel(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    isEditing = false;
    editedTitle = sketch.title;
    editedDescription = sketch.description;
    editedDuration = sketch.duration;
    editedCast = sketch.cast.join(', ');
  }

  function handleClick(event: MouseEvent | KeyboardEvent) {
    if (!isEditing) {
      dispatch('viewDetails', { sketch });
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClick(event);
    }
  }
</script>

<button
  type="button"
  class="w-full bg-white rounded-lg shadow-md p-4 transition-shadow duration-200 text-left"
  class:cursor-grab={!sketch.locked}
  class:cursor-not-allowed={sketch.locked}
  class:opacity-50={sketch.locked}
  class:hover:shadow-lg={!sketch.locked}
  on:click={handleClick}
  on:keydown={handleKeydown}
  role="button"
  aria-label="View sketch details"
>
  {#if isEditing}
    <div class="space-y-2" on:click|stopPropagation>
      <input
        type="text"
        bind:value={editedTitle}
        class="w-full p-2 border rounded"
        placeholder="Title"
      />
      <textarea
        bind:value={editedDescription}
        class="w-full p-2 border rounded"
        placeholder="Description"
      ></textarea>
      <input
        type="number"
        bind:value={editedDuration}
        class="w-full p-2 border rounded"
        placeholder="Duration (minutes)"
      />
      <input
        type="text"
        bind:value={editedCast}
        class="w-full p-2 border rounded"
        placeholder="Cast members (comma-separated)"
      />
      <div class="flex justify-end space-x-2">
        <button
          type="button"
          on:click={handleCancel}
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          on:click={handleSave}
          class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  {:else}
    <div class="flex justify-between items-start">
      <div>
        <h3 class="text-lg font-semibold">{sketch.title}</h3>
        <p class="text-gray-600">{sketch.description}</p>
        <p class="text-sm text-gray-500">Duration: {sketch.duration} minutes</p>
        <p class="text-sm text-gray-500">Cast: {sketch.cast.join(', ')}</p>
        <p class="text-sm text-gray-500">
          Characters: {sketch.chars} | Casted: {sketch.casted}
        </p>
      </div>
      <div class="flex space-x-2" on:click|stopPropagation>
        <button
          type="button"
          on:click={handleEdit}
          on:keydown={(e) => e.key === 'Enter' && handleEdit(e)}
          class="p-1 text-gray-500 hover:text-gray-700"
          aria-label="Edit sketch"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button
          type="button"
          on:click={toggleLock}
          on:keydown={(e) => e.key === 'Enter' && toggleLock(e)}
          class="p-1 text-gray-500 hover:text-gray-700"
          aria-label={sketch.locked ? 'Unlock sketch' : 'Lock sketch'}
        >
          {#if sketch.locked}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
          {/if}
        </button>
      </div>
    </div>
  {/if}
</button> 