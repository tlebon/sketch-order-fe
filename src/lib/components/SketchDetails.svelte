<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Sketch, CharacterPerformer } from '$lib/types';

  export let sketch: Sketch;
  const dispatch = createEventDispatcher();

  let isEditing = false;
  let editedTitle = sketch.title;
  let editedDescription = sketch.description;
  let editedDuration = sketch.duration;
  let editedChars = sketch.chars;
  let characterName = '';
  let performerName = '';
  let characterPerformers = [...(sketch.character_performers || [])];

  function handleEdit() {
    isEditing = true;
  }

  function handleCancel() {
    isEditing = false;
    editedTitle = sketch.title;
    editedDescription = sketch.description;
    editedDuration = sketch.duration;
    editedChars = sketch.chars;
    characterPerformers = [...(sketch.character_performers || [])];
  }

  function handleSave() {
    const updatedSketch: Sketch = {
      ...sketch,
      title: editedTitle,
      description: editedDescription,
      duration: editedDuration,
      chars: editedChars,
      casted: characterPerformers.length,
      character_performers: characterPerformers
    };
    dispatch('update', { sketch: updatedSketch });
    isEditing = false;
  }

  function addCharacterPerformer() {
    if (!characterName || !performerName) return;
    characterPerformers = [
      ...characterPerformers,
      {
        id: crypto.randomUUID(),
        sketch_id: sketch.id,
        character_name: characterName,
        performer_name: performerName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    characterName = '';
    performerName = '';
  }

  function removeCharacterPerformer(id: string) {
    characterPerformers = characterPerformers.filter(cp => cp.id !== id);
  }

  function handleClose(event: MouseEvent | KeyboardEvent) {
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
  onclick={handleClose}
>
  <div
    class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    onclick={(e) => e.stopPropagation()}
  >
    <div class="p-6">
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-4">
          <button
            type="button"
            onclick={handleClose}
            class="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Back to show"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h2 class="text-2xl font-bold text-gray-900">{sketch.title}</h2>
        </div>
        <button
          type="button"
          onclick={handleClose}
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

      {#if isEditing}
        <div class="edit-form">
          <div class="form-group">
            <label for="title">Title</label>
            <input
              type="text"
              id="title"
              bind:value={editedTitle}
              required
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              bind:value={editedDescription}
            ></textarea>
          </div>

          <div class="form-group">
            <label for="duration">Duration (minutes)</label>
            <input
              type="number"
              id="duration"
              bind:value={editedDuration}
              min="1"
              required
            />
          </div>

          <div class="form-group">
            <label for="chars">Number of Characters</label>
            <input
              type="number"
              id="chars"
              bind:value={editedChars}
              min="1"
              required
            />
          </div>

          <div class="form-group">
            <label>Character Assignments</label>
            <div class="character-inputs">
              <input
                type="text"
                bind:value={characterName}
                placeholder="Character name"
              />
              <input
                type="text"
                bind:value={performerName}
                placeholder="Performer name"
                onkeydown={(e) => e.key === 'Enter' && addCharacterPerformer()}
              />
              <button type="button" onclick={addCharacterPerformer}>Add</button>
            </div>
          </div>

          {#if characterPerformers.length > 0}
            <div class="character-list">
              <h4>Current Assignments</h4>
              <ul>
                {#each characterPerformers as cp}
                  <li>
                    <span class="character">{cp.character_name}</span>
                    <span class="performer">{cp.performer_name}</span>
                    <button
                      type="button"
                      onclick={() => removeCharacterPerformer(cp.id)}
                      class="remove-button"
                    >
                      ×
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <div class="form-actions">
            <button type="button" onclick={handleCancel}>Cancel</button>
            <button type="button" onclick={handleSave}>Save</button>
          </div>
        </div>
      {:else}
        <div class="view-mode">
          <div class="header">
            <h2>{sketch.title}</h2>
            <button type="button" onclick={handleEdit}>Edit</button>
          </div>

          {#if sketch.description}
            <p class="description">{sketch.description}</p>
          {/if}

          <div class="stats">
            <span>Duration: {sketch.duration} min</span>
            <span>Characters: {sketch.chars}</span>
            <span>Casted: {sketch.casted}</span>
          </div>

          {#if sketch.character_performers?.length}
            <div class="cast-list">
              <h4>Cast</h4>
              <ul>
                {#each sketch.character_performers as cp}
                  <li>
                    <span class="character">{cp.character_name}</span>
                    <span class="performer">{cp.performer_name}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Tech Details Section -->
          <div class="tech-details mt-4 pt-4 border-t border-gray-200">
            <h4 class="text-lg font-semibold text-gray-700 mb-2">Tech Details</h4>
            {#if sketch.techDetails}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <strong class="text-gray-600">Cues:</strong>
                  <p class="text-gray-800 whitespace-pre-wrap">{sketch.techDetails.cues || 'N/A'}</p>
                </div>
                <div>
                  <strong class="text-gray-600">Props:</strong>
                  <p class="text-gray-800 whitespace-pre-wrap">{sketch.techDetails.props || 'N/A'}</p>
                </div>
                <div>
                  <strong class="text-gray-600">Costume:</strong>
                  <p class="text-gray-800 whitespace-pre-wrap">{sketch.techDetails.costume || 'N/A'}</p>
                </div>
                <div>
                  <strong class="text-gray-600">Stage Dressing:</strong>
                  <p class="text-gray-800 whitespace-pre-wrap">{sketch.techDetails.stage_dressing || 'N/A'}</p>
                </div>
              </div>
            {:else}
              <p class="text-gray-500 italic">No tech details available for this sketch.</p>
            {/if}
          </div>
          <!-- End Tech Details Section -->

        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .sketch-details {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .description {
    margin: 1rem 0;
    color: #666;
  }

  .stats {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
    font-size: 0.9rem;
    color: #666;
  }

  .cast-list {
    margin-top: 1rem;
  }

  .cast-list h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .cast-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .cast-list li {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }

  .cast-list li:last-child {
    border-bottom: none;
  }

  .character {
    font-weight: bold;
  }

  .performer {
    color: #666;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  input,
  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }

  .character-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
    align-items: center;
  }

  .character-list {
    margin: 1rem 0;
  }

  .character-list h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .character-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .character-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #f5f5f5;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .remove-button {
    background: none;
    border: none;
    color: #f44336;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 0.5rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button[type="button"] {
    background: #f5f5f5;
    color: #333;
  }

  button[type="button"]:hover {
    background: #e0e0e0;
  }

  button[type="submit"] {
    background: #4CAF50;
    color: white;
  }

  button[type="submit"]:hover {
    background: #45a049;
  }
</style> 