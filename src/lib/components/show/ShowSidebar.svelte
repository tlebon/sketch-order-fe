<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Show } from '$lib/types';
  import PerformerFilter from '$lib/components/PerformerFilter.svelte';
  import CSVImport from '$lib/components/CSVImport.svelte';
  import Printer from '@lucide/svelte/icons/printer';
  import Filter from '@lucide/svelte/icons/filter';
  import Upload from '@lucide/svelte/icons/upload';
  import { fade } from 'svelte/transition';

  export let show: Show;
  export let performers: string[];
  export let selectedPerformer: string | null = null;
  export let printVersion: 'greenroom' | 'hallway' | 'techbooth' = 'greenroom';
  export let isSidebarCollapsed = false;

  const dispatch = createEventDispatcher<{
    collapse: { collapsed: boolean };
    filter: { performer: string | null };
    print: { printVersion: 'greenroom' | 'hallway' | 'techbooth' };
    importComplete: void;
    csvImport: { importType: 'sketches' | 'techDetails' | 'unknown', data: any[] };
  }>();

  let showFilterDropdown = false;

  function toggleSidebar() {
    isSidebarCollapsed = !isSidebarCollapsed;
    dispatch('collapse', { collapsed: isSidebarCollapsed });
  }

  function toggleFilterDropdown() {
    showFilterDropdown = !showFilterDropdown;
  }

  function handleFilterSelect(performer: string | null) {
    dispatch('filter', { performer });
    showFilterDropdown = false;
  }

  function handlePrint() {
    dispatch('print', { printVersion });
  }

  function handleCSVImport(e: CustomEvent<{ importType: 'sketches' | 'techDetails' | 'unknown', data: any[] }>) {
    dispatch('csvImport', e.detail);
  }
</script>

<div class="sidebar" class:collapsed={isSidebarCollapsed}>
  <button
    class="sidebar-button collapse-button"
    on:click={toggleSidebar}
    aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
  >
    <svg
      class="arrow-icon"
      class:collapsed={isSidebarCollapsed}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  </button>
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
    <div class="mt-4">
      <CSVImport showId={show.id} on:import={handleCSVImport} on:importComplete={() => dispatch('importComplete')} />
    </div>
  </div>
  {#if isSidebarCollapsed}
    <div class="collapsed-buttons">
      <button
        class="sidebar-button"
        on:click={handlePrint}
        title="Print Set List"
      >
        <Printer size={20} />
      </button>
      <div class="filter-container">
        <button
          class="sidebar-button"
          on:click={toggleFilterDropdown}
          title="Filter by Performer"
        >
          <Filter size={20} />
        </button>
        {#if showFilterDropdown}
          <div class="filter-dropdown" transition:fade>
            <button
              class="filter-option"
              class:active={selectedPerformer === null}
              on:click={() => handleFilterSelect(null)}
            >
              All Performers
            </button>
            {#each performers as performer}
              <button
                class="filter-option"
                class:active={selectedPerformer === performer}
                on:click={() => handleFilterSelect(performer)}
              >
                {performer}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <button
        class="sidebar-button"
        on:click={() => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          fileInput?.click();
        }}
        title="Import CSV"
      >
        <Upload size={20} />
      </button>
    </div>
  {/if}
</div>

<style>
  .sidebar {
    width: 300px;
    background: #f8f9fa;
    border-right: 1px solid #e9ecef;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    position: relative;
    transition: width 0.3s ease;
  }

  .sidebar.collapsed {
    width: 50px;
    padding: 1rem 0.5rem;
  }

  .sidebar.collapsed .sidebar-header,
  .sidebar.collapsed .sidebar-content {
    display: none;
  }

  .collapse-button {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
    width: 32px;
    height: 32px;
    background: #e9ecef;
    border: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    padding: 0;
    transition: background-color 0.2s ease;
  }

  .collapse-button:hover {
    background: #dee2e6;
  }

  .arrow-icon {
    transition: transform 0.3s ease;
    color: #495057;
  }

  .arrow-icon.collapsed {
    transform: rotate(180deg);
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
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sidebar-content :global(.csv-import) {
    margin: 0;
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

  .collapsed-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    position: absolute;
    top: 3rem;
    left: 0;
    right: 0;
    align-items: center;
  }

  .sidebar-button {
    width: 32px;
    height: 32px;
    background: #e9ecef;
    border: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #495057;
    padding: 0;
    flex-shrink: 0;
  }

  .sidebar-button:hover {
    background: #dee2e6;
    color: #212529;
  }

  .filter-container {
    position: relative;
    width: 32px;
    height: 32px;
  }

  .filter-dropdown {
    position: absolute;
    left: 100%;
    top: 0;
    margin-left: 0.5rem;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    min-width: 150px;
    z-index: 100;
  }

  .filter-option {
    display: block;
    width: 100%;
    padding: 0.5rem 1rem;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    color: #495057;
    font-size: 0.875rem;
  }

  .filter-option:hover {
    background: #f8f9fa;
  }

  .filter-option.active {
    background: #e9ecef;
    color: #212529;
  }
</style>
