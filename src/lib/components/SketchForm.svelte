<script lang="ts">
  import type { CharacterPerformer } from '$lib/server/db/types';
  import { createEventDispatcher } from 'svelte';

  export let showId: string;
  export let initialData: {
    title: string;
    description: string;
    duration: number;
    chars: number;
    character_performers: CharacterPerformer[];
  } | null = null;

  const dispatch = createEventDispatcher();

  let title = initialData?.title || '';
  let description = initialData?.description || '';
  let duration = initialData?.duration || 0;
  let chars = initialData?.chars || 0;
  let characterPerformers = initialData?.character_performers || [];
  let characterName = '';
  let performerName = '';

  function addCharacterPerformer() {
    if (!characterName || !performerName) return;
    characterPerformers = [...characterPerformers, {
      id: crypto.randomUUID(),
      sketch_id: '',
      character_name: characterName,
      performer_name: performerName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
    characterName = '';
    performerName = '';
  }

  function removeCharacterPerformer(index: number) {
    characterPerformers = characterPerformers.filter((_, i) => i !== index);
  }

  function handleSubmit() {
    dispatch('submit', {
      title,
      description,
      duration,
      chars,
      character_performers: characterPerformers.map(cp => ({
        character_name: cp.character_name,
        performer_name: cp.performer_name
      }))
    });
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="sketch-form">
  <div class="space-y-4">
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
      <input
        type="text"
        id="title"
        bind:value={title}
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
      <textarea
        id="description"
        bind:value={description}
        rows="3"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      ></textarea>
    </div>

    <div>
      <label for="duration" class="block text-sm font-medium text-gray-700">Duration (minutes)</label>
      <input
        type="number"
        id="duration"
        bind:value={duration}
        min="0"
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="chars" class="block text-sm font-medium text-gray-700">Number of Characters</label>
      <input
        type="number"
        id="chars"
        bind:value={chars}
        min="0"
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700">Character Assignments</label>
      <div class="mt-1 grid grid-cols-2 gap-2">
        <input
          type="text"
          bind:value={characterName}
          placeholder="Character name"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <input
          type="text"
          bind:value={performerName}
          placeholder="Performer name"
          on:keydown={(e) => e.key === 'Enter' && addCharacterPerformer()}
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <button
        type="button"
        on:click={addCharacterPerformer}
        class="mt-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
      >
        Add Assignment
      </button>
    </div>

    {#if characterPerformers.length > 0}
      <div class="mt-4">
        <h4 class="text-sm font-medium text-gray-700">Current Assignments</h4>
        <ul class="mt-2 divide-y divide-gray-200">
          {#each characterPerformers as cp, i}
            <li class="py-2 flex justify-between items-center">
              <div>
                <span class="font-medium">{cp.character_name}</span>
                <span class="text-gray-500 ml-2">→ {cp.performer_name}</span>
              </div>
              <button
                type="button"
                on:click={() => removeCharacterPerformer(i)}
                class="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="flex justify-end space-x-3">
      <button
        type="button"
        on:click={() => dispatch('cancel')}
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {initialData ? 'Update' : 'Create'} Sketch
      </button>
    </div>
  </div>
</form>

<style>
  .sketch-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  input, textarea {
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    width: 100%;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .button-primary {
    background-color: #3b82f6;
    color: white;
    border: none;
  }

  .button-primary:hover {
    background-color: #2563eb;
  }

  .button-secondary {
    background-color: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .button-secondary:hover {
    background-color: #f9fafb;
  }

  .character-list {
    margin-top: 1rem;
  }

  .character-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .character-item:last-child {
    border-bottom: none;
  }

  .remove-button {
    color: #ef4444;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
  }

  .remove-button:hover {
    color: #dc2626;
  }
</style>
