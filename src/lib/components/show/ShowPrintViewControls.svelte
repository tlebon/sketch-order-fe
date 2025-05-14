<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import PerformerFilter from '$lib/components/PerformerFilter.svelte';
  import Printer from '@lucide/svelte/icons/printer';

  export let printVersion: 'greenroom' | 'hallway' | 'techbooth' = 'greenroom';
  export let printViewPerformer: string | null = null;
  export let performers: string[] = [];

  const dispatch = createEventDispatcher();

  function handleVersionChange(version: 'greenroom' | 'hallway' | 'techbooth') {
    dispatch('versionChange', { printVersion: version });
  }
  function handlePerformerSelect(e: CustomEvent<{ performer: string | null }>) {
    dispatch('performerSelect', { performer: e.detail.performer });
  }
  function handleBack() {
    dispatch('back');
  }
  function handlePrint() {
    dispatch('print');
  }
</script>

<div class="print-header">
  <div class="left">
    <button class="back-btn" on:click={handleBack}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
        <path d="m15 18-6-6 6-6"/>
      </svg>
      Back to Show
    </button>
    <h2 class="print-title">Print View - {printVersion}</h2>
  </div>
  <div class="right">
    <div class="performer-filter-wrapper">
      <PerformerFilter
        {performers}
        selectedPerformer={printViewPerformer}
        on:select={handlePerformerSelect}
      />
    </div>
    <div class="print-version-btns">
      <button
        class="print-view-button"
        class:active={printVersion === 'greenroom'}
        on:click={() => handleVersionChange('greenroom')}
      >
        Greenroom
      </button>
      <button
        class="print-view-button"
        class:active={printVersion === 'hallway'}
        on:click={() => handleVersionChange('hallway')}
      >
        Hallway
      </button>
      <button
        class="print-view-button"
        class:active={printVersion === 'techbooth'}
        on:click={() => handleVersionChange('techbooth')}
      >
        Tech Booth
      </button>
    </div>
    <button class="print-btn" on:click={handlePrint} aria-label="Print set list">
      <Printer size={20} />
    </button>
  </div>
</div>

<style>
  .print-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem 1.5rem;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f3f4f6;
    border: none;
    border-radius: 4px;
    color: #374151;
    font-size: 1rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .back-btn:hover {
    background: #e5e7eb;
  }
  .print-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: #1f2937;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .performer-filter-wrapper {
    min-width: 200px;
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0;
  }
  .performer-filter-wrapper :global(label) {
    display: none;
  }
  .performer-filter-wrapper :global(select) {
    height: 32px;
    padding: 0 2rem 0 1rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background: #e9ecef url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23495057" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>') no-repeat right 0.75rem center/1rem 1rem;
    font-size: 0.875rem;
    color: #495057;
    transition: background-color 0.2s ease, border-color 0.2s;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 0;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }
  .performer-filter-wrapper :global(select:hover),
  .performer-filter-wrapper :global(select:focus) {
    background-color: #dee2e6;
    border-color: #9ca3af;
    outline: none;
  }
  .print-version-btns {
    display: flex;
    gap: 0.5rem;
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
  .print-btn {
    background: none;
    border: none;
    color: #374151;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;
    display: flex;
    align-items: center;
  }
  .print-btn:hover {
    background: #f3f4f6;
  }
  @media print {
    .print-header {
      display: none !important;
    }
  }
</style>
