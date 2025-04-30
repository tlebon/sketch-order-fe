<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Sketch } from '$lib/types';

  const { sketch } = $props<{ sketch: Sketch }>();

  const dispatch = createEventDispatcher();

  let isDragging = $state(false);
  let isEditing = $state(false);
  let editedTitle = $state(sketch.title);
  let editedDescription = $state(sketch.description);
  let editedDuration = $state(sketch.duration);
  let editedCast = $state(sketch.cast.join(', '));

  function handleDragStart(event: DragEvent) {
    if (sketch.locked) return;
    isDragging = true;
    event.dataTransfer?.setData('text/plain', sketch.id);
  }

  function handleDragEnd() {
    isDragging = false;
  }

  function handleClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    dispatch('viewDetails', { sketch });
  }

  function handleLock(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch('toggleLock', { id: sketch.id });
  }

  function handleDelete(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch('delete', { id: sketch.id });
  }

  function handleEdit(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    isEditing = true;
  }

  function handleSave(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const updatedSketch = {
      ...sketch,
      title: editedTitle,
      description: editedDescription,
      duration: editedDuration,
      cast: editedCast.split(',').map((name: string) => name.trim()).filter(Boolean)
    };
    dispatch('update', updatedSketch);
    isEditing = false;
  }

  function handleCancel(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    isEditing = false;
    editedTitle = sketch.title;
    editedDescription = sketch.description;
    editedDuration = sketch.duration;
    editedCast = sketch.cast.join(', ');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClick(event as unknown as MouseEvent);
    }
  }
</script>

<div
  class="relative bg-white rounded-lg shadow-md p-4 cursor-grab {sketch.locked ? 'cursor-not-allowed' : ''} {isDragging ? 'opacity-50' : ''}"
  draggable={!sketch.locked}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={handleKeydown}
>
  {#if isEditing}
    <div class="space-y-2" onclick={(e) => e.stopPropagation()}>
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
          onclick={handleCancel}
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleSave}
          class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  {:else}
    <div class="flex justify-between items-start mb-2">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900">{sketch.title}</h3>
        <p class="text-gray-600">{sketch.description}</p>
        <p class="text-sm text-gray-500">Duration: {sketch.duration} minutes</p>
        <p class="text-sm text-gray-500">
          Characters: {sketch.cast.length} | Casted: {sketch.casted}
        </p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          onclick={handleEdit}
          class="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Edit sketch"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          type="button"
          onclick={handleLock}
          class="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={sketch.locked ? 'Unlock sketch' : 'Lock sketch'}
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {#if sketch.locked}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            {:else}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            {/if}
          </svg>
        </button>
        <button
          type="button"
          onclick={handleDelete}
          class="text-red-500 hover:text-red-700 focus:outline-none"
          aria-label="Delete sketch"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-1">
      {#each sketch.cast as member}
        <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
          {member}
        </span>
      {/each}
    </div>
  {/if}
</div> 