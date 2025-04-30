<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Sketch } from '$lib/types';

  const dispatch = createEventDispatcher();

  let title = '';
  let description = '';
  let duration = 5;
  let chars = 1;
  let characterName = '';
  let performerName = '';
  let characterPerformers: { character_name: string; performer_name: string }[] = [];

  function addCharacterPerformer() {
    if (!characterName || !performerName) return;
    characterPerformers = [...characterPerformers, { character_name: characterName, performer_name: performerName }];
    characterName = '';
    performerName = '';
  }

  function removeCharacterPerformer(index: number) {
    characterPerformers = characterPerformers.filter((_, i) => i !== index);
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    const sketch: Omit<Sketch, 'id' | 'created_at' | 'updated_at'> = {
      title,
      description,
      duration,
      chars,
      casted: characterPerformers.length,
      locked: false,
      position: 0,
      character_performers: characterPerformers
    };
    dispatch('submit', { sketch });
    title = '';
    description = '';
    duration = 5;
    chars = 1;
    characterName = '';
    performerName = '';
    characterPerformers = [];
  }
</script>

<form onsubmit={handleSubmit} class="sketch-form">
  <div class="form-group">
    <label for="title">Title</label>
    <input
      type="text"
      id="title"
      bind:value={title}
      required
      placeholder="Enter sketch title"
    />
  </div>

  <div class="form-group">
    <label for="description">Description</label>
    <textarea
      id="description"
      bind:value={description}
      placeholder="Enter sketch description"
    ></textarea>
  </div>

  <div class="form-group">
    <label for="duration">Duration (minutes)</label>
    <input
      type="number"
      id="duration"
      bind:value={duration}
      min="1"
      required
    />
  </div>

  <div class="form-group">
    <label for="chars">Number of Characters</label>
    <input
      type="number"
      id="chars"
      bind:value={chars}
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
        {#each characterPerformers as cp, i}
          <li>
            <span class="character">{cp.character_name}</span>
            <span class="performer">{cp.performer_name}</span>
            <button
              type="button"
              onclick={() => removeCharacterPerformer(i)}
              class="remove-button"
            >
              ×
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <button type="submit" class="submit-button">Create Sketch</button>
</form>

<style>
  .sketch-form {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

  .character {
    font-weight: bold;
  }

  .performer {
    color: #666;
  }

  .remove-button {
    background: none;
    border: none;
    color: #f44336;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 0.5rem;
  }

  .submit-button {
    width: 100%;
    padding: 0.75rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .submit-button:hover {
    background: #45a049;
  }
</style> 