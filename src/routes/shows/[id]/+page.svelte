<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import SketchCard from '$lib/components/SketchCard.svelte';
  import SketchForm from '$lib/components/SketchForm.svelte';
  import CSVImport from '$lib/components/CSVImport.svelte';
  import SketchDetails from '$lib/components/SketchDetails.svelte';
  import type { PageData } from './$types';
  import type { Sketch } from '$lib/types';

  const { data } = $props<PageData>();

  let sketches = $state<Sketch[]>(data.sketches);
  let selectedSketch = $state<Sketch | null>(null);
  let isDragging = $state(false);

  async function handleDndConsider(e: CustomEvent<{ items: Sketch[], info: { sourceItem?: Sketch, targetIndex?: number, sourceIndex?: number } }>) {
    const { items, info } = e.detail;
    isDragging = true;
    
    // Don't allow dragging if the source item is locked
    if (info.sourceItem?.locked) {
      return;
    }

    // Don't allow dropping on locked items
    const targetIndex = info.targetIndex;
    if (targetIndex !== undefined && items[targetIndex]?.locked) {
      return;
    }

    // Don't allow moving locked items
    const sourceIndex = info.sourceIndex;
    if (sourceIndex !== undefined && items[sourceIndex]?.locked) {
      return;
    }

    // Don't allow moving items between locked items
    const sourceItem = items[sourceIndex];
    const targetItem = items[targetIndex];
    if (sourceItem?.locked || targetItem?.locked) {
      return;
    }

    sketches = items;
  }

  async function handleDndFinalize(e: CustomEvent<{ items: Sketch[], info: { sourceItem?: Sketch, targetIndex?: number, sourceIndex?: number } }>) {
    const { items, info } = e.detail;
    isDragging = false;
    
    // Don't allow dragging if the source item is locked
    if (info.sourceItem?.locked) {
      return;
    }

    // Don't allow dropping on locked items
    const targetIndex = info.targetIndex;
    if (targetIndex !== undefined && items[targetIndex]?.locked) {
      return;
    }

    // Don't allow moving locked items
    const sourceIndex = info.sourceIndex;
    if (sourceIndex !== undefined && items[sourceIndex]?.locked) {
      return;
    }

    // Don't allow moving items between locked items
    const sourceItem = items[sourceIndex];
    const targetItem = items[targetIndex];
    if (sourceItem?.locked || targetItem?.locked) {
      return;
    }

    sketches = items;

    // Update positions in the database
    const updates = items.map((sketch, index) => ({
      id: sketch.id,
      position: index
    }));

    try {
      const response = await fetch(`/api/shows/${data.show.id}/sketches`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error('Failed to update sketch order');
      }
    } catch (error) {
      console.error('Failed to update sketch order:', error);
      // Revert to the original order if the update fails
      sketches = [...sketches].sort((a, b) => a.position - b.position);
    }
  }

  async function handleCreate(e: CustomEvent<Sketch>) {
    const newSketch = {
      id: crypto.randomUUID(),
      ...e.detail,
      show_id: data.show.id,
      locked: false,
      position: sketches.length
    };

    try {
      const response = await fetch(`/api/shows/${data.show.id}/sketches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSketch)
      });

      if (!response.ok) {
        throw new Error('Failed to create sketch');
      }

      sketches = [...sketches, newSketch];
    } catch (error) {
      console.error('Failed to create sketch:', error);
    }
  }

  async function handleImport(e: CustomEvent<Sketch[]>) {
    const importedSketches = e.detail.map((sketch, index) => ({
      ...sketch,
      show_id: data.show.id,
      locked: false,
      position: sketches.length + index
    }));

    try {
      // Create all sketches in parallel
      const responses = await Promise.all(
        importedSketches.map(sketch =>
          fetch(`/api/shows/${data.show.id}/sketches`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(sketch)
          })
        )
      );

      // Check if all responses are successful
      if (responses.every(response => response.ok)) {
        sketches = [...sketches, ...importedSketches];
      } else {
        throw new Error('Failed to import some sketches');
      }
    } catch (error) {
      console.error('Failed to import sketches:', error);
      throw error; // Re-throw to show error in UI
    }
  }

  async function handleToggleLock(e: CustomEvent<{ id: string }>) {
    const { id } = e.detail;
    const sketch = sketches.find(s => s.id === id);
    if (!sketch) return;

    const newLockedState = !sketch.locked;

    try {
      const response = await fetch(`/api/shows/${data.show.id}/sketches`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, locked: newLockedState })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle sketch lock');
      }

      sketches = sketches.map(sketch => 
        sketch.id === id 
          ? { ...sketch, locked: newLockedState }
          : sketch
      );
    } catch (error) {
      console.error('Failed to toggle sketch lock:', error);
    }
  }

  async function handleDelete(e: CustomEvent<{ id: string }>) {
    const { id } = e.detail;
    try {
      const response = await fetch(`/api/shows/${data.show.id}/sketches/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete sketch');
      }

      sketches = sketches.filter(sketch => sketch.id !== id);
    } catch (error) {
      console.error('Failed to delete sketch:', error);
    }
  }

  function handleViewDetails(e: CustomEvent<{ sketch: Sketch }>) {
    if (!isDragging) {
      selectedSketch = e.detail.sketch;
    }
  }

  function handleCloseDetails() {
    selectedSketch = null;
  }

  function handleUpdate(event: CustomEvent<Sketch>) {
    const updatedSketch = event.detail;
    const index = sketches.findIndex(s => s.id === updatedSketch.id);
    if (index !== -1) {
      sketches[index] = updatedSketch;
      sketches = sketches; // Trigger reactivity
    }
  }
</script>

<div class="max-w-7xl mx-auto p-8">
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">{data.show.title}</h1>
    {#if data.show.description}
      <p class="text-gray-600">{data.show.description}</p>
    {/if}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
    <div class="space-y-8">
      <div class="sticky top-8 space-y-8">
        <CSVImport on:import={handleImport} />
        <SketchForm on:create={handleCreate} />
      </div>
    </div>

    <div class="min-h-[200px]">
      <div
        use:dndzone={{ items: sketches }}
        onconsider={handleDndConsider}
        onfinalize={handleDndFinalize}
        class="min-h-[100px] space-y-4"
      >
        {#each sketches as sketch (sketch.id)}
          <SketchCard 
            {sketch} 
            on:toggleLock={handleToggleLock}
            on:viewDetails={handleViewDetails}
            on:update={handleUpdate}
            on:delete={handleDelete}
          />
        {/each}
      </div>
    </div>
  </div>
</div>

{#if selectedSketch}
  <SketchDetails 
    sketch={selectedSketch} 
    on:close={handleCloseDetails}
  />
{/if} 