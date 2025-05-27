<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ViewGrid from '@lucide/svelte/icons/layout-grid';
  import ViewList from '@lucide/svelte/icons/list';
  import Wand2 from '@lucide/svelte/icons/wand-2';

  export let viewMode: 'grid' | 'list' = 'list';
  export let printVersion: 'greenroom' | 'hallway' | 'techbooth' = 'greenroom';
  export let showPrintView = false;

  const dispatch = createEventDispatcher<{
    viewModeChange: { viewMode: 'grid' | 'list' };
    printVersionChange: { printVersion: 'greenroom' | 'hallway' | 'techbooth' };
    showPrintViewChange: { showPrintView: boolean };
    optimize: void;
  }>();

  function handleViewModeChange(mode: 'grid' | 'list') {
    viewMode = mode;
    dispatch('viewModeChange', { viewMode: mode });
  }

  function handlePrintViewChange(version: 'greenroom' | 'hallway' | 'techbooth') {
    printVersion = version;
    dispatch('printVersionChange', { printVersion: version });
    dispatch('showPrintViewChange', { showPrintView: true });
  }

  function handleOptimize() {
    dispatch('optimize');
  }
</script>

<div class="view-controls">
  <div class="view-buttons">
    <button
      class="view-button"
      class:active={viewMode === 'grid'}
      on:click={() => handleViewModeChange('grid')}
      aria-label="Grid view"
    >
      <ViewGrid size={20} />
    </button>
    <button
      class="view-button"
      class:active={viewMode === 'list'}
      on:click={() => handleViewModeChange('list')}
      aria-label="List view"
    >
      <ViewList size={20} />
    </button>
  </div>
  <div class="action-buttons">
    <button
      class="optimize-button"
      on:click={handleOptimize}
      aria-label="Optimize running order"
      title="Optimize running order to minimize cast conflicts"
    >
      <Wand2 size={20} />
      <span>Optimize</span>
    </button>
    <div class="print-buttons">
      <button
        class="print-view-button"
        class:active={showPrintView && printVersion === 'greenroom'}
        on:click={() => handlePrintViewChange('greenroom')}
      >
        Green Room
      </button>
      <button
        class="print-view-button"
        class:active={showPrintView && printVersion === 'hallway'}
        on:click={() => handlePrintViewChange('hallway')}
      >
        Hallway
      </button>
      <button
        class="print-view-button"
        class:active={showPrintView && printVersion === 'techbooth'}
        on:click={() => handlePrintViewChange('techbooth')}
      >
        Tech Booth
      </button>
    </div>
  </div>
</div>

<style>
  .view-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    position: relative;
  }

  .view-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .print-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .view-button {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: #e9ecef;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
    color: #495057;
  }

  .view-button:hover {
    background: #dee2e6;
  }

  .view-button.active {
    background: #ced4da;
    color: #212529;
    font-weight: 500;
  }

  .optimize-button {
    height: 32px;
    padding: 0 1rem;
    border: none;
    border-radius: 4px;
    background: #3b82f6;
    color: white;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .optimize-button:hover {
    background: #2563eb;
  }

  .print-view-button {
    height: 32px;
    padding: 0 1rem;
    border: none;
    border-radius: 4px;
    background: #e9ecef;
    cursor: pointer;
    font-size: 0.875rem;
    color: #495057;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
  }

  .print-view-button:hover {
    background: #dee2e6;
  }

  .print-view-button.active {
    background: #ced4da;
    color: #212529;
    font-weight: 500;
  }
</style>
