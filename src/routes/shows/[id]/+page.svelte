<script lang="ts">
  import { page } from '$app/stores';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Sketch, SketchTechDetails } from '$lib/types';
  import PerformerFilter from '$lib/components/PerformerFilter.svelte';
  import CSVImport from '$lib/components/CSVImport.svelte';
  import SketchForm from '$lib/components/SketchForm.svelte';
  import SketchCard from '$lib/components/SketchCard.svelte';
  import SketchDetails from '$lib/components/SketchDetails.svelte';
  import ViewGrid from '@lucide/svelte/icons/layout-grid';
  import ViewList from '@lucide/svelte/icons/list';
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import { flip } from 'svelte/animate';
  import type { PageData } from './$types';
  import PrintSetList from '$lib/components/PrintSetList.svelte';
  import { fade } from 'svelte/transition';

  export let data: PageData;
  const dispatch = createEventDispatcher();
  const showId = $page.params.id;
  let show = data.show;
  let sketches: Sketch[] = data.sketches;
  let selectedSketch: Sketch | null = null;
  let selectedPerformer: string | null = null;
  let viewMode: 'grid' | 'list' = 'list';
  const flipDurationMs = 300;
  let showPrintView = false;
  let printVersion: 'greenroom' | 'hallway' | 'techbooth' = 'greenroom';
  let expandedSketchId: string | null = null;
  let draggedSketch: Sketch | null = null;
  let draggedOverIndex: number | null = null;
  let printViewPerformer: string | null = null;

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  $: performers = [...new Set(
    sketches.flatMap(s => s.character_performers || [])
      .map(cp => cp.performer_name)
  )].sort();

  $: filteredSketches = selectedPerformer
    ? sketches.filter(s => s.character_performers?.some(cp => cp.performer_name === selectedPerformer))
    : sketches;

  $: printViewFilteredSketches = printViewPerformer
    ? sketches.filter(s => s.character_performers?.some(cp => cp.performer_name === printViewPerformer))
    : sketches;

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

  function handleLockClick(id: string, locked: boolean) {
    handleLock(new CustomEvent('lock', { detail: { id, locked } }));
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

  function handleDeleteClick(id: string) {
    handleDelete(new CustomEvent('delete', { detail: { id } }));
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

  function handleDragStart(e: DragEvent, sketch: Sketch) {
    if (sketch.locked) {
      e.preventDefault();
      return;
    }
    draggedSketch = sketch;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (!draggedSketch || draggedSketch.locked) return;
    
    const targetSketch = filteredSketches[index];
    if (targetSketch.locked) return;

    draggedOverIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDragLeave() {
    draggedOverIndex = null;
  }

  async function handleDrop(e: DragEvent, index: number) {
    e.preventDefault();
    if (!draggedSketch || draggedSketch.locked) return;
    
    const targetSketch = filteredSketches[index];
    if (targetSketch.locked) return;

    const newSketches = [...filteredSketches];
    const draggedIndex = newSketches.findIndex(s => s.id === draggedSketch?.id);
    
    if (draggedIndex !== -1) {
      newSketches.splice(draggedIndex, 1);
      newSketches.splice(index, 0, draggedSketch);
      
      const finalFilteredOrder = newSketches;
      const finalFilteredPositionMap = new Map(finalFilteredOrder.map((item, index) => [item.id, index]));

      const nextSketches = sketches
        .map(sketch => {
          if (sketch.locked) {
            return sketch;
          }
          const newPosition = finalFilteredPositionMap.get(sketch.id);
          return { ...sketch, position: newPosition !== undefined ? newPosition : sketch.position };
        })
        .sort((a, b) => a.position - b.position)
        .map((sketch, index) => ({ ...sketch, position: index }));

      sketches = nextSketches;
      await updateSketchOrderInBackend(nextSketches);
    }

    draggedSketch = null;
    draggedOverIndex = null;
  }

  function handleDragEnd() {
    draggedSketch = null;
    draggedOverIndex = null;
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
    setTimeout(() => {
      window.print();
      showPrintView = false;
    }, 100);
  }

  function toggleSketchExpand(sketchId: string) {
    expandedSketchId = expandedSketchId === sketchId ? null : sketchId;
  }

  function hasCharacterMismatch(sketch: Sketch): boolean {
    const performerCount = sketch.character_performers?.length || 0;
    return performerCount !== sketch.chars;
  }
</script>

{#if showPrintView}
  <div class="fixed inset-0 bg-white z-50 overflow-auto">
    <div class="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between print:hidden">
      <div class="flex items-center gap-4">
        <button
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          on:click={() => showPrintView = false}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Show
        </button>
        <h2 class="text-lg font-medium text-gray-900">Print View - {printVersion}</h2>
      </div>
      <div class="flex items-center gap-4">
        <div class="performer-filter-wrapper">
          <PerformerFilter
            performers={performers}
            selectedPerformer={printViewPerformer}
            on:select={(e) => printViewPerformer = e.detail.performer}
          />
        </div>
        <div class="flex gap-2">
          <button
            class="print-view-button {printVersion === 'greenroom' ? 'active' : ''}"
            on:click={() => printVersion = 'greenroom'}
          >
            Greenroom
          </button>
          <button
            class="print-view-button {printVersion === 'hallway' ? 'active' : ''}"
            on:click={() => printVersion = 'hallway'}
          >
            Hallway
          </button>
          <button
            class="print-view-button {printVersion === 'techbooth' ? 'active' : ''}"
            on:click={() => printVersion = 'techbooth'}
          >
            Tech Booth
          </button>
        </div>
        <button
          class="text-gray-600 hover:text-gray-900"
          on:click={() => window.print()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect width="12" height="8" x="6" y="14"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="p-4">
      <PrintSetList
        sketches={printViewFilteredSketches}
        showTitle={show.title}
        version={printVersion}
      />
    </div>
  </div>
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
        <div class="view-buttons">
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
        <div class="print-buttons">
          <button 
            class="print-view-button" 
            class:active={showPrintView && printVersion === 'greenroom'} 
            on:click={() => {
              printVersion = 'greenroom';
              showPrintView = true;
            }}
          >
            Green Room
          </button>
          <button 
            class="print-view-button" 
            class:active={showPrintView && printVersion === 'hallway'} 
            on:click={() => {
              printVersion = 'hallway';
              showPrintView = true;
            }}
          >
            Hallway
          </button>
          <button 
            class="print-view-button" 
            class:active={showPrintView && printVersion === 'techbooth'} 
            on:click={() => {
              printVersion = 'techbooth';
              showPrintView = true;
            }}
          >
            Tech Booth
          </button>
        </div>
      </div>

      {#if viewMode === 'list'}
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
            >
              <div class="list-item-header">
                <div class="list-item-main">
                  <span class="position">{sketch.position + 1}.</span>
                  <span class="title" on:click={() => selectedSketch = sketch}>{sketch.title}</span>
                  {#if hasCharacterMismatch(sketch)}
                    <AlertTriangle class="warning-icon" size={16} />
                  {/if}
                  <span class="duration">{formatDuration(sketch.duration)}</span>
                  <div class="list-item-actions">
                    <button 
                      class="action-button lock-button" 
                      class:locked={sketch.locked}
                      on:click|stopPropagation={() => handleLockClick(sketch.id, !sketch.locked)}
                    >
                      {sketch.locked ? '🔒' : '🔓'}
                    </button>
                    <button 
                      class="action-button delete-button"
                      on:click|stopPropagation={() => handleDeleteClick(sketch.id)}
                    >
                      🗑️
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
      {:else}
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
            >
              <SketchCard 
                {sketch} 
                on:update={loadSketches} 
                on:select={() => selectedSketch = sketch}
                showCharacterWarning={hasCharacterMismatch(sketch)}
              />
            </div>
          {/each}
        </div>
      {/if}

      {#if selectedSketch}
        <div class="modal-backdrop" on:click={() => selectedSketch = null}>
          <div class="modal-content" on:click|stopPropagation>
            <SketchDetails 
              sketch={selectedSketch} 
              on:close={() => selectedSketch = null}
              on:update={handleUpdate}
            />
          </div>
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
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0 1rem;
  }

  .view-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .print-buttons {
    display: flex;
    gap: 0.5rem;
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

  .print-view-button {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    color: #4b5563;
    transition: all 0.2s;
  }

  .print-view-button:hover {
    background: #f3f4f6;
  }

  .print-view-button.active {
    background: #e5e7eb;
    color: #1f2937;
    border-color: #9ca3af;
    font-weight: 500;
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
  }

  .list-item:hover {
    background: #f8fafc;
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
    font-size: 1rem;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .action-button:hover {
    opacity: 1;
  }

  .lock-button.locked {
    opacity: 1;
  }

  .delete-button:hover {
    color: #ef4444;
  }

  .list-item .title {
    cursor: pointer;
  }

  .list-item .title:hover {
    color: #3b82f6;
  }

  .grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 1rem;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
  }

  .warning-icon {
    color: #f59e0b;
    margin-left: 0.5rem;
  }

  .character-count {
    color: #f59e0b;
    font-size: 0.875rem;
    margin-left: 0.5rem;
  }

  .print-preview {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    z-index: 1000;
    overflow-y: auto;
    padding: 2rem;
  }

  .print-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    color: #4b5563;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-button:hover {
    background: #e5e7eb;
    color: #1f2937;
  }

  .back-button svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .print-preview-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .close-button {
    font-size: 1.5rem;
    color: #6b7280;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    line-height: 1;
    border-radius: 0.375rem;
  }

  .close-button:hover {
    background: #f3f4f6;
    color: #1f2937;
  }

  @media print {
    .print-preview-header {
      display: none;
    }
  }

  .list-item.locked {
    opacity: 0.8;
    cursor: not-allowed;
  }

  .list-item.locked:hover {
    background: #f8fafc;
  }

  .sketch-list-item.locked {
    opacity: 0.8;
    cursor: not-allowed;
  }

  .sketch-list-item.locked:hover {
    background: #f9fafb;
  }

  .list-item.dragging {
    opacity: 0.5;
  }

  .list-item.drag-over {
    border-top: 2px solid #3b82f6;
  }

  .sketch-list-item.dragging {
    opacity: 0.5;
  }

  .sketch-list-item.drag-over {
    border-top: 2px solid #3b82f6;
  }

  .performer-filter-wrapper {
    min-width: 200px;
  }

  .performer-filter-wrapper :global(.performer-filter) {
    margin: 0;
  }

  .performer-filter-wrapper :global(.performer-filter select) {
    height: 36px;
    padding: 0 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    background-color: white;
    font-size: 0.875rem;
    color: #374151;
    transition: all 0.2s;
  }

  .performer-filter-wrapper :global(.performer-filter select:hover) {
    border-color: #d1d5db;
  }

  .performer-filter-wrapper :global(.performer-filter select:focus) {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .performer-filter-wrapper :global(.performer-filter label) {
    display: none;
  }
</style> 