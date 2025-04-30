<script lang="ts">
  import { page } from '$app/stores';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Sketch } from '$lib/types';
  import PerformerFilter from '$lib/components/PerformerFilter.svelte';
  import CSVImport from '$lib/components/CSVImport.svelte';
  import SketchForm from '$lib/components/SketchForm.svelte';
  import SketchCard from '$lib/components/SketchCard.svelte';
  import SketchDetails from '$lib/components/SketchDetails.svelte';
  import ViewGrid from '@lucide/svelte/icons/layout-grid';
  import ViewList from '@lucide/svelte/icons/list';
  import { dndzone, type DndEventInfo } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  const dispatch = createEventDispatcher();
  const showId = $page.params.id;
  let sketches: Sketch[] = [];
  let selectedSketch: Sketch | null = null;
  let selectedPerformer: string | null = null;
  let viewMode: 'grid' | 'list' = 'grid';
  const flipDurationMs = 300;

  $: filteredSketches = sketches.filter(sketch => 
    !selectedPerformer || 
    sketch.character_performers?.some(cp => cp.performer_name === selectedPerformer)
  ).sort((a, b) => a.position - b.position);

  onMount(async () => {
    await loadSketches();
  });

  async function handleCreate(e: CustomEvent<{ sketch: Omit<Sketch, 'id' | 'created_at' | 'updated_at'> }>) {
    try {
      const response = await fetch(`/api/sketches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...e.detail.sketch, show_id: showId })
      });
      
      if (!response.ok) throw new Error('Failed to create sketch');
      
      const newSketch = await response.json();
      newSketch.position = sketches.length;
      sketches = [...sketches, newSketch];
    } catch (error) {
      console.error('Error creating sketch:', error);
    }
  }

  async function handleImport(e: CustomEvent<{ sketches: Sketch[] }>) {
    try {
      const response = await fetch(`/api/sketches/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          show_id: showId, 
          sketches: e.detail.sketches.map((sketch, index) => ({
            ...sketch,
            position: sketches.length + index
          }))
        })
      });
      
      if (!response.ok) throw new Error('Failed to import sketches');
      
      const newSketches = await response.json();
      sketches = [...sketches, ...newSketches].sort((a,b) => a.position - b.position);
    } catch (error) {
      console.error('Error importing sketches:', error);
    }
  }

  async function handleLock(e: CustomEvent<{ id: string; locked: boolean }>) {
    try {
      const response = await fetch(`/api/sketches/${e.detail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: e.detail.locked })
      });
      
      if (!response.ok) throw new Error('Failed to update sketch');
      
      sketches = sketches.map(sketch => 
        sketch.id === e.detail.id ? { ...sketch, locked: e.detail.locked } : sketch
      );
    } catch (error) {
      console.error('Error updating sketch:', error);
    }
  }

  async function handleDelete(e: CustomEvent<{ id: string }> | { detail: { id: string } }) {
    const sketchId = e.detail.id;
    if (!sketchId) return;

    try {
      const response = await fetch(`/api/sketches/${sketchId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete sketch');
      
      const deletedSketchIndex = sketches.findIndex(s => s.id === sketchId);
      sketches = sketches.filter(sketch => sketch.id !== sketchId);
      sketches = sketches.map((s, index) => ({ ...s, position: index }));
      if (selectedSketch?.id === sketchId) {
        selectedSketch = null;
      }
      await updateSketchOrderInBackend(sketches);
    } catch (error) {
      console.error('Error deleting sketch:', error);
    }
  }

  async function handleUpdate(e: CustomEvent<{ sketch: Sketch }>) {
    try {
      const response = await fetch(`/api/sketches/${e.detail.sketch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(e.detail.sketch)
      });
      
      if (!response.ok) throw new Error('Failed to update sketch');
      
      sketches = sketches.map(s => s.id === e.detail.sketch.id ? e.detail.sketch : s).sort((a,b) => a.position - b.position);
      if (selectedSketch?.id === e.detail.sketch.id) {
        selectedSketch = e.detail.sketch;
      }
    } catch (error) {
      console.error('Error updating sketch:', error);
    }
  }

  function handleDndConsider(e: CustomEvent<{ items: Sketch[], info: DndEventInfo }>) {
    filteredSketches = e.detail.items;
  }

  async function handleDndFinalize(e: CustomEvent<{ items: Sketch[], info: DndEventInfo }>) {
    const finalFilteredOrder = filteredSketches;

    const finalFilteredPositionMap = new Map(finalFilteredOrder.map((item, index) => [item.id, index]));

    const nextSketches = sketches
      .map(sketch => {
        const newPosition = finalFilteredPositionMap.get(sketch.id);
        return { ...sketch, position: newPosition !== undefined ? newPosition : sketch.position };
      })
      .sort((a, b) => a.position - b.position)
      .map((sketch, index) => ({ ...sketch, position: index }));

    sketches = nextSketches;

    await updateSketchOrderInBackend(nextSketches);
  }

  async function updateSketchOrderInBackend(orderedSketches: Sketch[]) {
      const sketchUpdates = orderedSketches.map(s => ({ id: s.id, position: s.position }));
      try {
          const response = await fetch('/api/sketches', { 
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updates: sketchUpdates })
          });

          if (!response.ok) {
              console.error('Failed to reorder sketches API call failed');
              await loadSketches();
              throw new Error('Failed to reorder sketches');
          }
      } catch (error) {
          console.error('Error reordering sketches:', error);
          await loadSketches();
      }
  }

  async function loadSketches() {
    try {
      const response = await fetch(`/api/sketches?show_id=${showId}`);
      if (!response.ok) throw new Error('Failed to load sketches');
      const fetchedSketches = await response.json();
      sketches = fetchedSketches
          .map((s: Sketch, index: number) => ({ ...s, position: s.position ?? index }))
          .sort((a: Sketch, b: Sketch) => a.position - b.position);
    } catch (error) {
      console.error('Error loading sketches:', error);
      sketches = [];
    }
  }
</script>

<div class="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex gap-6">
  <!-- Sidebar -->
  <div class="w-64 flex-shrink-0 space-y-6 bg-gray-50 p-4 rounded-lg shadow">
    <h2 class="text-xl font-semibold text-gray-700 border-b pb-2">Controls</h2>
    <div>
      <h3 class="text-lg font-medium mb-2 text-gray-600">Filter</h3>
      <PerformerFilter
        bind:selectedPerformer
        performers={sketches.flatMap(s => s.character_performers?.map(cp => cp.performer_name) || [])}
      />
    </div>
    <div>
        <h3 class="text-lg font-medium mb-2 text-gray-600">Import</h3>
      <CSVImport on:import={handleImport} />
    </div>
    <div>
      <h3 class="text-lg font-medium mb-2 text-gray-600">Create New</h3>
      <SketchForm on:submit={handleCreate} />
    </div>
  </div>

  <!-- Main Content -->
  <div class="flex-grow">
    <div class="flex justify-between items-center mb-6 border-b pb-3">
        <h1 class="text-3xl font-bold text-gray-800">Show Management</h1>
        <div class="flex space-x-1 border border-gray-300 rounded-md p-0.5">
            <button 
              on:click={() => viewMode = 'grid'}
              class="p-1 rounded-md {viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}"
              aria-label="Grid View"
              title="Grid View"
            >
                <ViewGrid size={20} />
            </button>
            <button 
              on:click={() => viewMode = 'list'}
              class="p-1 rounded-md {viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}"
              aria-label="List View"
              title="List View"
            >
                <ViewList size={20} />
            </button>
        </div>
    </div>
    
    <div class="flex gap-6">
      <!-- Sketch List Area -->
      <div class="flex-grow">
        {#if viewMode === 'grid'}
          <div 
            use:dndzone={{
              items: filteredSketches, 
              flipDurationMs, 
              type: 'sketch'
            }}
            on:consider={handleDndConsider}
            on:finalize={handleDndFinalize}
            class="sketch-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {#each filteredSketches as sketch (sketch.id)}
              <div 
                animate:flip={{ duration: flipDurationMs }}
                class="{sketch.locked ? 'opacity-75' : ''}"
               >
                <SketchCard
                  {sketch}
                  isSelected={selectedSketch?.id === sketch.id}
                  on:select={(e) => selectedSketch = e.detail.sketch}
                  on:lock={handleLock}
                  on:delete={handleDelete}
                  />
              </div>
            {/each}
          </div>
        {:else} <!-- List View -->
          <div 
            use:dndzone={{
              items: filteredSketches, 
              flipDurationMs, 
              type: 'sketch'
            }}
            on:consider={handleDndConsider}
            on:finalize={handleDndFinalize}
            class="sketch-list space-y-2"
          >
            {#each filteredSketches as sketch (sketch.id)}
              <div 
                animate:flip={{ duration: flipDurationMs }} 
                class="sketch-list-item flex items-center justify-between p-3 bg-white rounded shadow border border-gray-200 {sketch.locked ? 'bg-gray-100 opacity-75' : 'cursor-grab'}"
              >
                 <div class="flex items-center space-x-3">
                   <span class="text-gray-500 font-mono text-sm w-6 text-right">{sketch.position + 1}.</span>
                   <span class="font-medium text-gray-800">{sketch.title}</span>
                </div>
                 <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">{sketch.duration} min</span>
                     <button 
                        class="text-gray-400 hover:text-gray-600 p-1 rounded {selectedSketch?.id === sketch.id ? 'bg-blue-100' : ''}"
                        title="Select Sketch"
                        on:click|stopPropagation={() => selectedSketch = sketch} 
                     >
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                     </button>
                     <button 
                        class="text-gray-400 hover:text-red-500 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Sketch"
                        on:click|stopPropagation={() => handleDelete({ detail: { id: sketch.id } })}
                        disabled={sketch.locked}
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                 </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Sketch Details (if selected) -->
      {#if selectedSketch}
        <div class="w-1/3 flex-shrink-0">
            <h2 class="text-xl font-semibold mb-4 text-gray-700">Sketch Details</h2>
           <SketchDetails
              sketch={selectedSketch}
              on:update={handleUpdate}
              on:close={() => selectedSketch = null}
            />
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Removed old styles for .show-page, .header, .content, .sketch-list */
  /* Basic styles for sketch-grid might still be useful if not fully covered by Tailwind */
  .sketch-grid {
    /* Add any non-Tailwind grid styles if needed */
  }

  /* Keep drag-related styles */
  .sketch-list-item {
    transition: background-color 0.2s ease-in-out;
  }
  .sketch-list-item:hover {
     background-color: #f9fafb; /* Slightly lighter gray on hover */
  }
</style> 