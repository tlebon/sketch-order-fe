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
            <button type="button" onclick={handleEdit} class="edit-button">Edit</button>
          </div>

          {#if sketch.description}
            <p class="description">{sketch.description}</p>
          {/if}

          <div class="stats-container">
            <div class="stat-item">
              <span class="stat-label">Duration</span>
              <span class="stat-value">{sketch.duration} min</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Characters</span>
              <span class="stat-value">{sketch.chars}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Casted</span>
              <span class="stat-value">{sketch.casted}</span>
            </div>
          </div>

          {#if sketch.character_performers?.length}
            <div class="cast-section">
              <h4 class="section-title">Cast</h4>
              <div class="cast-grid">
                {#each sketch.character_performers as cp}
                  <div class="cast-item">
                    <span class="character-name">{cp.character_name}</span>
                    <span class="performer-name">{cp.performer_name}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Tech Details Section -->
          <div class="tech-section">
            <h4 class="section-title">Tech Details</h4>
            {#if sketch.techDetails}
              <div class="tech-grid">
                <div class="tech-item">
                  <span class="tech-label">Cues</span>
                  <span class="tech-value">{sketch.techDetails.cues || 'N/A'}</span>
                </div>
                <div class="tech-item">
                  <span class="tech-label">Props</span>
                  <span class="tech-value">{sketch.techDetails.props || 'N/A'}</span>
                </div>
                <div class="tech-item">
                  <span class="tech-label">Costume</span>
                  <span class="tech-value">{sketch.techDetails.costume || 'N/A'}</span>
                </div>
                <div class="tech-item">
                  <span class="tech-label">Stage Dressing</span>
                  <span class="tech-value">{sketch.techDetails.stage_dressing || 'N/A'}</span>
                </div>
              </div>
            {:else}
              <p class="no-tech-details">No tech details available for this sketch.</p>
            {/if}
          </div>
          <!-- End Tech Details Section -->

        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .form-group label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }
  .form-group input,
  .form-group textarea {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    background: #f9fafb;
    color: #111827;
    resize: vertical;
  }
  .form-group textarea {
    min-height: 60px;
    max-height: 200px;
  }
  .character-inputs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .character-inputs input {
    flex: 1 1 0;
  }
  .character-inputs button {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
  }
  .character-inputs button:hover {
    background: #2563eb;
  }
  .character-list {
    margin-top: 0.5rem;
    background: #f3f4f6;
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
  }
  .character-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .character-list li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
  }
  .character-list .character {
    font-weight: 500;
    color: #374151;
  }
  .character-list .performer {
    color: #6b7280;
  }
  .remove-button {
    background: none;
    border: none;
    color: #ef4444;
    font-size: 1.25rem;
    cursor: pointer;
    margin-left: auto;
    padding: 0 0.5rem;
    border-radius: 0.25rem;
    transition: background 0.2s;
  }
  .remove-button:hover {
    background: #fee2e2;
  }
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }
  .form-actions button {
    padding: 0.5rem 1.25rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 500;
    cursor: pointer;
    background: #e5e7eb;
    color: #374151;
    transition: background 0.2s;
  }
  .form-actions button:last-child {
    background: #3b82f6;
    color: white;
  }
  .form-actions button:last-child:hover {
    background: #2563eb;
  }

  .view-mode {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
  }

  .edit-button {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .edit-button:hover {
    background-color: #2563eb;
  }

  .description {
    color: #4b5563;
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }

  .stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .stat-value {
    font-size: 1.125rem;
    color: #1f2937;
    font-weight: 600;
  }

  .cast-section {
    background-color: #f9fafb;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .tech-section {
    background-color: #f9fafb;
    border-radius: 0.5rem;
    padding: 0.75rem;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cast-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
  }

  .tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
  }

  .cast-item, .tech-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    background-color: white;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
  }

  .character-name, .tech-label {
    font-weight: 500;
    color: #1f2937;
    font-size: 0.875rem;
  }

  .performer-name, .tech-value {
    font-size: 0.875rem;
    color: #6b7280;
    white-space: pre-wrap;
  }

  .no-tech-details {
    color: #6b7280;
    font-style: italic;
    font-size: 0.875rem;
    padding: 0.5rem;
    background-color: white;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
  }
</style>
