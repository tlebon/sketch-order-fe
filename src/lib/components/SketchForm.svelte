<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let title = '';
  let description = '';
  let duration = 5;
  let castMember = '';
  let cast: string[] = [];

  function addCastMember() {
    if (castMember.trim()) {
      cast = [...cast, castMember.trim()];
      castMember = '';
    }
  }

  function removeCastMember(index: number) {
    cast = cast.filter((_, i) => i !== index);
  }

  function handleSubmit() {
    if (!title.trim()) return;

    dispatch('create', {
      title: title.trim(),
      description: description.trim(),
      duration,
      cast
    });

    // Reset form
    title = '';
    description = '';
    duration = 5;
    cast = [];
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="bg-white p-6 rounded-lg shadow-sm">
  <div class="mb-4">
    <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
    <input
      type="text"
      id="title"
      bind:value={title}
      required
      placeholder="Enter sketch title"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  <div class="mb-4">
    <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
    <textarea
      id="description"
      bind:value={description}
      placeholder="Enter sketch description"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
    ></textarea>
  </div>

  <div class="mb-4">
    <label for="duration" class="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
    <input
      type="number"
      id="duration"
      bind:value={duration}
      min="1"
      max="30"
      required
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  <div class="mb-4">
    <label for="cast-input" class="block text-sm font-medium text-gray-700 mb-1">Cast Members</label>
    <div class="flex gap-2 mb-2">
      <input
        type="text"
        id="cast-input"
        bind:value={castMember}
        placeholder="Enter cast member name"
        onkeydown={(e) => e.key === 'Enter' && addCastMember()}
        class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        type="button"
        onclick={addCastMember}
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Add
      </button>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each cast as member, i}
        <span class="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-sm">
          {member}
          <button
            type="button"
            onclick={() => removeCastMember(i)}
            class="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={`Remove ${member} from cast`}
          >
            ×
          </button>
        </span>
      {/each}
    </div>
  </div>

  <button
    type="submit"
    class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
  >
    Create Sketch
  </button>
</form> 