<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import type { PageData } from './$types';
  import { Trash2 } from '@lucide/svelte';

  const { data } = $props();

  let shows = $state(data.shows);
  let isDragging = $state(false);
  let showForm = $state(false);
  let newShow = $state({
    title: '',
    description: ''
  });

  async function handleDndConsider(e: CustomEvent) {
    const { items } = e.detail;
    isDragging = true;
    shows = items;
  }

  async function handleDndFinalize(e: CustomEvent) {
    const { items } = e.detail;
    isDragging = false;
    shows = items;

    // Update positions in the database
    const updates = items.map((show: { id: string }, index: number) => ({
      id: show.id,
      position: index
    }));

    try {
      const response = await fetch('/api/shows', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error('Failed to update show order');
      }
    } catch (error) {
      console.error('Failed to update show order:', error);
      // Revert to the original order if the update fails
      shows = [...shows].sort((a, b) => a.position - b.position);
    }
  }

  async function handleCreate() {
    const show = {
      id: crypto.randomUUID(),
      ...newShow,
      position: shows.length
    };

    try {
      const response = await fetch('/api/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(show)
      });

      if (!response.ok) {
        throw new Error('Failed to create show');
      }

      shows = [...shows, show];
      showForm = false;
      newShow = { title: '', description: '' };
    } catch (error) {
      console.error('Failed to create show:', error);
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/shows/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete show');
      }

      shows = shows.filter(show => show.id !== id);
    } catch (error) {
      console.error('Failed to delete show:', error);
    }
  }
</script>

<div class="max-w-7xl mx-auto p-8">
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Sketch Show Manager</h1>
    <p class="text-gray-600">Create and manage your sketch shows. Drag and drop to reorder.</p>
  </div>

  <div class="flex justify-end mb-6">
    <button
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
      onclick={() => showForm = true}
    >
      Create New Show
    </button>
  </div>

  {#if showForm}
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Create New Show</h2>
      <form onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
        <div class="space-y-4">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              bind:value={newShow.title}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              bind:value={newShow.description}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              rows="3"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              onclick={() => showForm = false}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Create Show
            </button>
          </div>
        </div>
      </form>
    </div>
  {/if}

  <div
    use:dndzone={{ items: shows }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
    class="space-y-4"
  >
    {#each shows as show (show.id)}
      <div class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">
              <a href="/shows/{show.id}" class="hover:text-blue-500">
                {show.title}
              </a>
            </h2>
            {#if show.description}
              <p class="mt-1 text-gray-600">{show.description}</p>
            {/if}
          </div>
          <div class="flex space-x-2">
            <button
              class="text-red-500 hover:text-red-600"
              onclick={() => handleDelete(show.id)}
              aria-label="Delete show"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
