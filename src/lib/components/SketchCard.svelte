<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Sketch } from '$lib/types';
  import { slide } from 'svelte/transition';
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';

  export let sketch: Sketch;
  export let isSelected = false;
  export let showCharacterWarning = false;

  let isCastVisible = false;

  const dispatch = createEventDispatcher();

  function handleClick(e: MouseEvent) {
    if (e.target instanceof HTMLElement && e.target.closest('button, .cast-toggle')) {
      return;
    }
    if (e.target instanceof HTMLElement && e.target.closest('.card')) {
      dispatch('select', { sketch });
    }
  }

  function handleLock(e: MouseEvent) {
    e.stopPropagation();
    dispatch('lock', { id: sketch.id, locked: !sketch.locked });
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    dispatch('delete', { id: sketch.id });
  }

  function toggleCastVisibility(e: MouseEvent) {
    e.stopPropagation();
    isCastVisible = !isCastVisible;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.target instanceof HTMLElement && e.target.closest('button, .cast-toggle')) {
        if (e.target.closest('.cast-toggle')) {
          toggleCastVisibility(e as unknown as MouseEvent);
        }
      } else {
        handleClick(e as unknown as MouseEvent);
      }
    }
  }
</script>

<div
  class="card {isSelected ? 'selected border-blue-500' : 'border-gray-200'} {sketch.locked ? 'locked' : ''} border bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 flex flex-col"
  on:click={handleClick}
  on:keydown={handleKeydown}
  tabindex="0"
  role="button"
  aria-label="View sketch details for {sketch.title}"
  style="min-height: 150px;"
>
  <div class="p-4 flex-grow">
    <div class="flex justify-between items-center mb-2">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-semibold text-gray-800 truncate" title={sketch.title}>{sketch.title}</h3>
        {#if showCharacterWarning}
          <AlertTriangle class="warning-icon" size={16} />
        {/if}
      </div>
      <div class="flex items-center gap-0.5">
        <button
          class="action-button lock-button"
          class:locked={sketch.locked}
          on:click|stopPropagation={handleLock}
          aria-label={sketch.locked ? 'Unlock sketch' : 'Lock sketch'}
          title={sketch.locked ? 'Unlock sketch' : 'Lock sketch'}
        >
          {#if sketch.locked}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" /></svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v3m-6 2h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
          {/if}
        </button>
        <button
          class="action-button delete-button"
          on:click|stopPropagation={handleDelete}
          aria-label="Delete sketch"
          title="Delete sketch"
        >
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>

    <p class="description text-sm text-gray-600 mb-3 line-clamp-1" title={sketch.description || 'A sketch waiting for its story...'}>
      {sketch.description || 'A sketch waiting for its story...'}
    </p>

    <div class="stats text-xs text-gray-500 space-x-3 mb-3">
      <span>Duration: {sketch.duration} min</span>
      <span>Chars: {sketch.chars}</span>
      <span>Casted: {sketch.casted}</span>
      {#if showCharacterWarning}
        <span class="text-amber-500">
          ({sketch.character_performers?.length || 0}/{sketch.chars} characters)
        </span>
      {/if}
    </div>
  </div>

  {#if sketch.character_performers && sketch.character_performers.length > 0}
    <div class="border-t border-gray-200 px-4 py-2">
        <button
            class="cast-toggle text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none w-full text-left flex justify-between items-center"
            on:click={toggleCastVisibility}
            aria-expanded={isCastVisible}
        >
            <span>Show Cast ({sketch.character_performers.length})</span>
            <svg class="w-4 h-4 transform transition-transform duration-200 {isCastVisible ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
    </div>
    {#if isCastVisible}
        <div class="cast-list px-4 pb-3 pt-1 bg-gray-50" transition:slide={{ duration: 200 }}>
        <ul class="text-xs space-y-1">
            {#each sketch.character_performers as cp (cp.id || cp.character_name + cp.performer_name)}
            <li class="flex justify-between">
                <span class="font-medium text-gray-700">{cp.character_name}</span>
                <span class="text-gray-500">{cp.performer_name}</span>
            </li>
            {/each}
        </ul>
        </div>
    {/if}
  {/if}
</div>

<style>
  .card:focus-visible {
     outline: 2px solid blue;
     outline-offset: 2px;
  }

  .card.locked {
    background: #f8fafc;
    cursor: not-allowed;
  }

  .card.locked:hover {
    background: #f8fafc;
  }

  .action-button {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: #6b7280;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-button:hover {
    color: #374151;
  }

  .lock-button.locked {
    color: #374151;
  }

  .delete-button:hover {
    color: #ef4444;
  }
</style>
