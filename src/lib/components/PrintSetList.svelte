<!-- PrintSetList.svelte -->
<script lang="ts">
  import type { Sketch } from '$lib/types';

  export let sketches: Sketch[];
  export let showTitle: string;
  export let version: 'greenroom' | 'hallway' | 'techbooth';

  $: sortedSketches = [...sketches].sort((a, b) => a.position - b.position);

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  function formatPerformers(sketch: Sketch): string {
    return (sketch.character_performers || [])
      .map(cp => cp.performer_name)
      .join(', ');
  }
</script>

<div class="print-container">
  <div class="header">
    <h1>{showTitle}</h1>
    <div class="version-info">
      {#if version === 'greenroom'}
        Green Room Version
      {:else if version === 'hallway'}
        Hallway Version
      {:else}
        Tech Booth Version
      {/if}
    </div>
  </div>

  <div class="sketches">
    {#each sortedSketches as sketch}
      <div class="sketch">
        <div class="sketch-header">
          <span class="position">{sketch.position + 1}.</span>
          <span class="title">{sketch.title}</span>
          <span class="duration">{formatDuration(sketch.duration)}</span>
        </div>
        
        <div class="performers">
          {formatPerformers(sketch)}
        </div>

        {#if version === 'hallway' || version === 'techbooth'}
          <div class="tech-details">
            {#if sketch.techDetails?.costume}
              <div class="detail">
                <strong>Costume:</strong> {sketch.techDetails.costume}
              </div>
            {/if}
            {#if sketch.techDetails?.stage_dressing}
              <div class="detail">
                <strong>Stage:</strong> {sketch.techDetails.stage_dressing}
              </div>
            {/if}
          </div>
        {/if}

        {#if version === 'techbooth'}
          <div class="tech-details">
            {#if sketch.techDetails?.cues}
              <div class="detail">
                <strong>Cues:</strong> {sketch.techDetails.cues}
              </div>
            {/if}
            {#if sketch.techDetails?.props}
              <div class="detail">
                <strong>Props:</strong> {sketch.techDetails.props}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .print-container {
    padding: 0.5cm;
    font-family: Arial, sans-serif;
  }

  .header {
    text-align: center;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #000;
    padding-bottom: 0.25rem;
  }

  .header h1 {
    margin: 0;
    font-size: 18pt;
  }

  .version-info {
    font-size: 10pt;
    color: #666;
    margin-top: 0.25rem;
  }

  .sketches {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sketch {
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.25rem;
    page-break-inside: avoid;
  }

  .sketch-header {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    margin-bottom: 0.125rem;
  }

  .position {
    font-weight: bold;
    min-width: 1.5rem;
  }

  .title {
    font-weight: bold;
    font-size: 11pt;
  }

  .duration {
    margin-left: auto;
    color: #666;
    font-size: 9pt;
  }

  .performers {
    font-size: 10pt;
    color: #333;
    margin-left: 2rem;
  }

  .tech-details {
    margin-left: 2rem;
    font-size: 9pt;
    color: #444;
  }

  .detail {
    margin-top: 0.125rem;
  }

  @media print {
    @page {
      size: A4;
      margin: 0.5cm;
    }

    body {
      margin: 0;
      padding: 0;
    }

    .print-container {
      padding: 0;
    }

    .sketch {
      break-inside: avoid;
    }
  }
</style> 