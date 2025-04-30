<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let performers: string[] = [];
  export let selectedPerformer: string | null = null;

  const dispatch = createEventDispatcher();

  function handleSelect(e: Event) {
    const select = e.target as HTMLSelectElement;
    const value = select.value === '' ? null : select.value;
    selectedPerformer = value;
    dispatch('select', { performer: value });
  }
</script>

<div class="performer-filter">
  <label for="performer-select">Filter by Performer</label>
  <select
    id="performer-select"
    value={selectedPerformer || ''}
    on:change={handleSelect}
  >
    <option value="">All Performers</option>
    {#each performers as performer}
      <option value={performer}>{performer}</option>
    {/each}
  </select>
</div>

<style>
  .performer-filter {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 500;
    color: #333;
  }

  select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    min-width: 200px;
  }
</style> 