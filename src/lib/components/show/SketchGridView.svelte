<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Sketch } from '$lib/types';
  import SketchCard from '$lib/components/SketchCard.svelte';
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
  function handleLock(e: CustomEvent<{ id: string; locked: boolean }>) {
    dispatch('lock', e.detail);
  }
  function handleDelete(e: CustomEvent<{ id: string }>) {
    dispatch('delete', e.detail);
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
</script>

<div class="grid-view">
  {#each filteredSketches as sketch, index (sketch.id)}
    <div
      class="sketch-list-item"
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
      <SketchCard
        {sketch}
        on:update={() => {}}
        on:select={() => handleSketchSelect(sketch)}
        on:lock={handleLock}
        on:delete={handleDelete}
        showCharacterWarning={hasCharacterMismatch(sketch)}
      />
    </div>
  {/each}
</div>

<style>
  .grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
  .sketch-list-item {
    position: relative;
    transition: all 0.2s ease;
    cursor: move;
  }
  .sketch-list-item.locked {
    background: #f8fafc;
    cursor: not-allowed;
  }
  .sketch-list-item.drag-over::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -2px;
    height: 2px;
    background-color: #3b82f6;
    z-index: 1;
  }
  .sketch-list-item.dragging {
    opacity: 0.5;
  }
</style>
