<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { readCSVFile, processSketchData } from '$lib/utils/csv';

  const dispatch = createEventDispatcher();
  let fileInput: HTMLInputElement;
  let isDragging = false;

  async function handleImport() {
    const files = fileInput.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const data = await readCSVFile(file);
      const processedSketches = processSketchData(data);
      dispatch('import', { sketches: processedSketches });
      fileInput.value = ''; // Reset file input
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Error importing CSV file. Please check the file format.');
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      fileInput.files = files;
      handleImport();
    }
  }
</script>

<div
  class="bg-white p-6 rounded-lg shadow-sm"
  ondragover={(e) => handleDragOver(e)}
  ondragleave={(e) => handleDragLeave(e)}
  ondrop={(e) => handleDrop(e)}
  class:border-2={isDragging}
  class:border-dashed={isDragging}
  class:border-blue-500={isDragging}
>
  <h2 class="text-lg font-medium text-gray-900 mb-4">Import Sketches from CSV</h2>
  
  <div class="space-y-4">
    <div class="flex items-center justify-center w-full">
      <label
        for="csv-file"
        class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
      >
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            class="w-8 h-8 mb-4 text-gray-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p class="mb-2 text-sm text-gray-500">
            <span class="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p class="text-xs text-gray-500">CSV files only</p>
        </div>
        <input
          id="csv-file"
          type="file"
          accept=".csv"
          bind:this={fileInput}
          class="hidden"
        />
      </label>
    </div>

    <button
      type="button"
      onclick={handleImport}
      class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Import CSV
    </button>
  </div>
</div> 