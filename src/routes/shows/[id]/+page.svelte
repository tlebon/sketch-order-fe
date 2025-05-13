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
  import Printer from '@lucide/svelte/icons/printer';
  import { flip } from 'svelte/animate';
  import type { PageData } from './$types';
  import PrintSetList from '$lib/components/PrintSetList.svelte';
  import { fade } from 'svelte/transition';
  import ShowSidebar from '$lib/components/show/ShowSidebar.svelte';
  import ViewControls from '$lib/components/show/ViewControls.svelte';
  import SketchListView from '$lib/components/show/SketchListView.svelte';
  import SketchGridView from '$lib/components/show/SketchGridView.svelte';
  import ShowPrintViewControls from '$lib/components/show/ShowPrintViewControls.svelte';

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
  let isSidebarCollapsed = false;
  let showFilterDropdown = false;

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

  // TODO: Add an option to manually create a sketch
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

  function toggleSidebar() {
    isSidebarCollapsed = !isSidebarCollapsed;
  }

  function toggleFilterDropdown() {
    showFilterDropdown = !showFilterDropdown;
  }

  function handleFilterSelect(performer: string | null) {
    selectedPerformer = performer;
    showFilterDropdown = false;
  }
</script>

{#if showPrintView}
  <div class="fixed inset-0 bg-white z-50 overflow-auto">
    <ShowPrintViewControls
      {printVersion}
      {printViewPerformer}
      {performers}
      on:back={() => showPrintView = false}
      on:versionChange={e => printVersion = e.detail.printVersion}
      on:performerSelect={e => printViewPerformer = e.detail.performer}
      on:print={handlePrint}
    />
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
    <ShowSidebar
      {show}
      {performers}
      bind:selectedPerformer
      bind:printVersion
      bind:isSidebarCollapsed
      on:collapse={({ detail }) => isSidebarCollapsed = detail.collapsed}
      on:filter={({ detail }) => selectedPerformer = detail.performer}
      on:print={({ detail }) => {
        printVersion = detail.printVersion;
        handlePrint();
      }}
      on:importComplete={loadSketches}
      on:csvImport={handleImport}
    />

    <div class="content">
      <ViewControls
        bind:viewMode
        bind:printVersion
        bind:showPrintView
        on:viewModeChange={(e: CustomEvent<{ viewMode: 'grid' | 'list' }>) => viewMode = e.detail.viewMode}
        on:printVersionChange={(e: CustomEvent<{ printVersion: 'greenroom' | 'hallway' | 'techbooth' }>) => printVersion = e.detail.printVersion}
        on:showPrintViewChange={(e: CustomEvent<{ showPrintView: boolean }>) => showPrintView = e.detail.showPrintView}
      />

      {#if viewMode === 'list'}
        <SketchListView
          {sketches}
          {filteredSketches}
          bind:expandedSketchId
          {draggedSketch}
          {draggedOverIndex}
          {flipDurationMs}
          bind:selectedSketch
          on:select={e => selectedSketch = e.detail.sketch}
          on:lock={e => handleLockClick(e.detail.id, e.detail.locked)}
          on:delete={e => handleDeleteClick(e.detail.id)}
          on:expand={e => toggleSketchExpand(e.detail.sketchId)}
          on:dragstart={(e) => handleDragStart(e.detail.event, e.detail.sketch)}
          on:dragover={(e) => handleDragOver(e.detail.event, e.detail.index)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e.detail.event, e.detail.index)}
          on:dragend={handleDragEnd}
        />
      {:else}
        <SketchGridView
          {sketches}
          {filteredSketches}
          bind:expandedSketchId
          {draggedSketch}
          {draggedOverIndex}
          {flipDurationMs}
          bind:selectedSketch
          on:select={e => selectedSketch = e.detail.sketch}
          on:lock={e => handleLockClick(e.detail.id, e.detail.locked)}
          on:delete={e => handleDeleteClick(e.detail.id)}
          on:expand={e => toggleSketchExpand(e.detail.sketchId)}
          on:dragstart={(e) => handleDragStart(e.detail.event, e.detail.sketch)}
          on:dragover={(e) => handleDragOver(e.detail.event, e.detail.index)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e.detail.event, e.detail.index)}
          on:dragend={handleDragEnd}
        />
      {/if}

      {#if selectedSketch}
        <div
          class="modal-backdrop"
          on:click={() => selectedSketch = null}
          on:keydown={(e) => e.key === 'Escape' && (selectedSketch = null)}
          role="dialog"
          aria-modal="true"
          aria-label="Sketch details"
        >
          <div
            class="modal-content"
            on:click|stopPropagation
            role="document"
          >
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

  .content {
    flex: 1;
    overflow-y: auto;
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
    z-index: 50;
  }

  .modal-content {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    max-width: 32rem;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  @media print {
    .modal-backdrop {
      display: none;
    }
  }
</style>
