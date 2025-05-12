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
  import type { PageData } from './$types';
  import PrintSetList from '$lib/components/PrintSetList.svelte';
  import { fade } from 'svelte/transition';

  export let data: PageData;
  const dispatch = createEventDispatcher();
  const showId = $page.params.id;
  let show = data.show;
  let sketches = data.sketches;
  let selectedSketch: Sketch | null = null;
  let selectedPerformer: string | null = null;
  let viewMode: 'grid' | 'list' = 'grid';
  const flipDurationMs = 300;
  let showPrintView = false;
  let printVersion: 'greenroom' | 'hallway' | 'techbooth' = 'techbooth';

  $: performers = [...new Set(sketches.flatMap(sketch => 
    sketch.character_performers?.map(cp => cp.performer_name) || []
  ))].sort();

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

  async function handleImport(e: CustomEvent<{ importType: 'sketches' | 'techDetails' | 'unknown', data: any[] }>) {
    try {
      const { importType, data } = e.detail;

      if (importType === 'unknown') {
        // This case should ideally be handled within CSVImport.svelte by not dispatching
        // but as a safeguard:
        console.error('Import type is unknown. Aborting.');
        alert('Could not determine CSV type. Please check file format.');
        return;
      }

      let requestBody;
      if (importType === 'sketches') {
        requestBody = {
          show_id: showId,
          importType,
          data: data.map((sketch, index) => ({
            ...sketch,
            position: sketches.length + index // Assuming sketches is the current list
          }))
        };
      } else { // techDetails
        requestBody = {
          show_id: showId,
          importType,
          data // Send raw data objects for techDetails
        };
      }

      const response = await fetch(`/api/sketches/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ error: 'Failed to import data. Unknown error.' }));
        throw new Error(errorResult.error || 'Failed to import data');
      }
      
      const importResults = await response.json();

      if (importType === 'sketches') {
        const newSketches = importResults
          .filter((r: { success: boolean; sketch?: Sketch }) => r.success && r.sketch)
          .map((r: { sketch: Sketch }) => r.sketch);
        
        if (newSketches.length > 0) {
          sketches = [...sketches, ...newSketches].sort((a,b) => a.position - b.position);
          alert(`${newSketches.length} sketch(es) imported successfully.`);
        } else {
          // Check for partial success or specific errors reported in importResults
          const errors = importResults.filter((r: { success: boolean }) => !r.success);
          if (errors.length > 0) {
            alert(`Import partially failed. ${errors.length} sketch(es) had issues. Check console for details.`);
            console.error('Sketch import errors:', errors);
          } else {
            alert('No new sketches were imported. The file might have been empty or all rows failed.');
          }
        }
      } else { // techDetails
        const successfulTechUpdates = importResults.filter((r: { success: boolean }) => r.success).length;
        const failedTechUpdates = importResults.length - successfulTechUpdates;
        alert(`Tech details import complete. ${successfulTechUpdates} successful, ${failedTechUpdates} failed. Check console for details.`);
        if (failedTechUpdates > 0) {
            console.error('Tech detail import issues:', importResults.filter((r: { success: boolean }) => !r.success));
        }
        // Reload sketches to see updated tech details
        await loadSketches(); 
      }

    } catch (error) {
      console.error('Error importing data:', error);
      alert(`Error during import: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          .map((s: any) => ({ 
            ...s, 
            position: s.position ?? 0,
            locked: Boolean(s.locked) // Convert number to boolean
          }))
          .sort((a: Sketch, b: Sketch) => a.position - b.position);
    } catch (error) {
      console.error('Error loading sketches:', error);
      sketches = [];
    }
  }

  function handlePrint() {
    showPrintView = true;
    // Use setTimeout to ensure the print view is rendered before printing
    setTimeout(() => {
      window.print();
      showPrintView = false;
    }, 100);
  }
</script>

{#if showPrintView}
  <PrintSetList {sketches} showTitle={show.title} version={printVersion} />
{:else}
  <div class="show-page">
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>{show.title}</h1>
        <div class="print-controls">
          <select bind:value={printVersion}>
            <option value="greenroom">Green Room Version</option>
            <option value="hallway">Hallway Version</option>
            <option value="techbooth">Tech Booth Version</option>
          </select>
          <button on:click={handlePrint} class="print-button">
            Print Set List
          </button>
        </div>
      </div>
      <div class="sidebar-content">
        <PerformerFilter {performers} bind:selectedPerformer />
        <CSVImport showId={show.id} on:importComplete={loadSketches} />
      </div>
    </div>

    <div class="content">
      <div class="view-controls">
        <button 
          class="view-button" 
          class:active={viewMode === 'grid'} 
          on:click={() => viewMode = 'grid'}
        >
          <ViewGrid size={20} />
        </button>
        <button 
          class="view-button" 
          class:active={viewMode === 'list'} 
          on:click={() => viewMode = 'list'}
        >
          <ViewList size={20} />
        </button>
      </div>

      {#if viewMode === 'grid'}
        <div class="sketches-grid">
          {#each filteredSketches as sketch (sketch.id)}
            <div transition:fade>
              <SketchCard {sketch} on:update={loadSketches} />
            </div>
          {/each}
        </div>
      {:else}
        <div class="sketches-list" use:dndzone={{items: filteredSketches, flipDurationMs}} on:consider={handleDndConsider} on:finalize={handleDndFinalize}>
          {#each filteredSketches as sketch (sketch.id)}
            <div class="sketch-list-item" animate:flip={{duration: flipDurationMs}}>
              <SketchCard {sketch} on:update={loadSketches} />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .show-page {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .sidebar {
    width: 300px;
    background: #f8f9fa;
    border-right: 1px solid #e9ecef;
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .sidebar-header {
    margin-bottom: 1rem;
  }

  .sidebar-header h1 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .view-controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .view-button {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-button.active {
    background: #e9ecef;
  }

  .print-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
  }

  .print-button {
    padding: 0.5rem 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .print-button:hover {
    background: #45a049;
  }

  .sketches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .sketches-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sketch-list-item {
    transition: background-color 0.2s ease-in-out;
  }

  .sketch-list-item:hover {
    background-color: #f9fafb;
  }

  @media print {
    .show-page {
      display: none;
    }
  }
</style> 