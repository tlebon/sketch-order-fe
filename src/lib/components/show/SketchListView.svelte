<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Sketch } from '$lib/types';
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import { flip } from 'svelte/animate';

  export let sketches: Sketch[] = [];
  export let filteredSketches: Sketch[] = [];
  export let expandedSketchId: string | null = null;
  export let draggedSketch: Sketch | null = null;
  export let draggedOverIndex: number | null = null;
  export let flipDurationMs: number = 300;
  export let selectedSketch: Sketch | null = null;

  const dispatch = createEventDispatcher();

  function handleSketchSelect(sketch: Sketch) {
    dispatch('select', { sketch });
  }
  function handleLockClick(id: string, locked: boolean) {
    dispatch('lock', { id, locked });
  }
  function handleDeleteClick(id: string) {
    dispatch('delete', { id });
  }
  function toggleSketchExpand(sketchId: string) {
    dispatch('expand', { sketchId });
  }
  function handleDragStart(e: DragEvent, sketch: Sketch) {
    dispatch('dragstart', { event: e, sketch });
  }
  function handleDragOver(e: DragEvent, index: number) {
    dispatch('dragover', { event: e, index });
  }
  function handleDragLeave() {
    dispatch('dragleave');
  }
  function handleDrop(e: DragEvent, index: number) {
    dispatch('drop', { event: e, index });
  }
  function handleDragEnd() {
    dispatch('dragend');
  }
  function hasCharacterMismatch(sketch: Sketch): boolean {
    const performerCount = sketch.character_performers?.length || 0;
    return performerCount !== sketch.chars;
  }
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
</script>

<div class="list-view">
  {#each filteredSketches as sketch, index (sketch.id)}
    <div
      class="list-item"
      class:expanded={expandedSketchId === sketch.id}
      class:locked={sketch.locked}
      class:dragging={draggedSketch?.id === sketch.id}
      class:drag-over={draggedOverIndex === index}
      animate:flip={{duration: flipDurationMs}}
      draggable={!sketch.locked}
      on:dragstart={(e) => handleDragStart(e, sketch)}
      on:dragover={(e) => handleDragOver(e, index)}
      on:dragleave={handleDragLeave}
      on:drop={(e) => handleDrop(e, index)}
      on:dragend={handleDragEnd}
      role="listitem"
    >
      <div class="list-item-header">
        <div class="list-item-main">
          <span class="position">{sketch.position + 1}.</span>
          <button
            class="title"
            on:click={() => handleSketchSelect(sketch)}
            on:keydown={(e) => e.key === 'Enter' && handleSketchSelect(sketch)}
            aria-label={`View details for ${sketch.title}`}
          >
            {sketch.title}
          </button>
          {#if hasCharacterMismatch(sketch)}
            <AlertTriangle class="warning-icon" size={16} />
          {/if}
          <span class="duration">{formatDuration(sketch.duration)}</span>
          <div class="list-item-actions">
            <button
              class="action-button lock-button"
              class:locked={sketch.locked}
              on:click|stopPropagation={() => handleLockClick(sketch.id, !sketch.locked)}
              aria-label={sketch.locked ? 'Unlock sketch' : 'Lock sketch'}
              title={sketch.locked ? 'Unlock sketch' : 'Lock sketch'}
            >
              {#if sketch.locked}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v3m-6 2h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              {/if}
            </button>
            <button
              class="action-button delete-button"
              on:click|stopPropagation={() => handleDeleteClick(sketch.id)}
              aria-label="Delete sketch"
              title="Delete sketch"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div class="list-item-performers">
          {(sketch.character_performers || [])
            .map(cp => cp.performer_name)
            .join(', ')}
          {#if hasCharacterMismatch(sketch)}
            <span class="character-count">
              ({sketch.character_performers?.length || 0}/{sketch.chars} characters)
            </span>
          {/if}
        </div>
      </div>

      {#if expandedSketchId === sketch.id}
        <div class="list-item-details">
          {#if sketch.description}
            <div class="description">
              <strong>Description:</strong> {sketch.description}
            </div>
          {/if}

          {#if sketch.techDetails}
            <div class="tech-details">
              {#if sketch.techDetails.costume}
                <div class="detail">
                  <strong>Costume:</strong> {sketch.techDetails.costume}
                </div>
              {/if}
              {#if sketch.techDetails.stage_dressing}
                <div class="detail">
                  <strong>Stage:</strong> {sketch.techDetails.stage_dressing}
                </div>
              {/if}
              {#if sketch.techDetails.cues}
                <div class="detail">
                  <strong>Cues:</strong> {sketch.techDetails.cues}
                </div>
              {/if}
              {#if sketch.techDetails.props}
                <div class="detail">
                  <strong>Props:</strong> {sketch.techDetails.props}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .list-view {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }
  .list-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 0.75rem;
    cursor: move;
    transition: all 0.2s ease;
    position: relative;
  }
  .list-item.locked {
    background: #f8fafc;
    cursor: not-allowed;
  }
  .list-item:hover {
    background: #f8fafc;
  }
  .list-item.locked:hover {
    background: #f8fafc;
  }
  .list-item.drag-over::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -2px;
    height: 2px;
    background-color: #3b82f6;
    z-index: 1;
  }
  .list-item.dragging {
    opacity: 0.5;
  }
  .list-item.expanded {
    background: #f8fafc;
  }
  .list-item-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .list-item-main {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
  .list-item .position {
    font-weight: bold;
    min-width: 2rem;
    color: #64748b;
  }
  .list-item .title {
    font-weight: 600;
    font-size: 1rem;
    color: #1e293b;
    cursor: pointer;
  }
  .list-item .title:hover {
    color: #3b82f6;
  }
  .list-item .duration {
    margin-left: auto;
    color: #64748b;
    font-size: 0.875rem;
  }
  .list-item-performers {
    font-size: 0.875rem;
    color: #64748b;
    margin-left: 2.5rem;
  }
  .list-item-details {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
    font-size: 0.875rem;
  }
  .list-item-details .description {
    margin-bottom: 0.5rem;
    color: #475569;
  }
  .list-item-details .tech-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
  }
  .list-item-details .detail {
    color: #475569;
  }
  .list-item-details .detail strong {
    color: #64748b;
  }
  .list-item-actions {
    display: flex;
    gap: 0.5rem;
    margin-left: 1rem;
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
  .warning-icon {
    color: #f59e0b;
  }
  .character-count {
    color: #f59e0b;
    font-size: 0.875rem;
    margin-left: 0.5rem;
  }
</style>
