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
      .map(cp => version === 'greenroom' ? `<strong>${cp.performer_name.toUpperCase()}</strong>` : cp.performer_name)
      .join(', ');
  }

  function wordToNumber(word: string): number {
    const numberWords: { [key: string]: number } = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    return numberWords[word.toLowerCase()] || 0;
  }

  function parseStageDressing(stageDressing: string | null | undefined): { chairs: number; stools: number } {
    if (!stageDressing) return { chairs: 0, stools: 0 };

    const lowerCase = stageDressing.toLowerCase();

    // Match both numeric and word-based numbers
    const chairMatch = lowerCase.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*chair/);
    const stoolMatch = lowerCase.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*stool/);

    return {
      chairs: chairMatch ? (isNaN(parseInt(chairMatch[1])) ? wordToNumber(chairMatch[1]) : parseInt(chairMatch[1])) : 0,
      stools: stoolMatch ? (isNaN(parseInt(stoolMatch[1])) ? wordToNumber(stoolMatch[1]) : parseInt(stoolMatch[1])) : 0
    };
  }

  function calculateDifferential(currentSketch: Sketch, previousSketch: Sketch | undefined): string {
    const current = {
      chairs: currentSketch.techDetails?.chairs ?? 0,
      stools: currentSketch.techDetails?.stools ?? 0
    };
    const previous = previousSketch ? {
      chairs: previousSketch.techDetails?.chairs ?? 0,
      stools: previousSketch.techDetails?.stools ?? 0
    } : { chairs: 0, stools: 0 };

    const chairDiff = current.chairs - previous.chairs;
    const stoolDiff = current.stools - previous.stools;

    const changes = [];
    if (chairDiff !== 0) {
      changes.push(`${chairDiff > 0 ? '+' : ''}${chairDiff} chair${Math.abs(chairDiff) !== 1 ? 's' : ''}`);
    }
    if (stoolDiff !== 0) {
      changes.push(`${stoolDiff > 0 ? '+' : ''}${stoolDiff} stool${Math.abs(stoolDiff) !== 1 ? 's' : ''}`);
    }

    return changes.length > 0 ? `(${changes.join(', ')})` : '';
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
    {#each sortedSketches as sketch, index}
      <div class="sketch">
        <div class="sketch-header">
          <span class="position">{sketch.position + 1}.</span>
          <span class="title">{sketch.title}</span>
          <span class="duration">{formatDuration(sketch.duration)}</span>
        </div>

        <div class="performers">
          {@html formatPerformers(sketch)}
        </div>

        <div class="tech-details">
          {#if (version === 'greenroom' || version === 'hallway') && sketch.techDetails?.costume}
            <div class="detail">
              <strong>Costume:</strong> {sketch.techDetails.costume}
            </div>
          {/if}
          {#if (version === 'hallway' || version === 'techbooth') && sketch.techDetails?.stage_dressing}
            <div class="detail">
              <strong>Stage:</strong> {sketch.techDetails.stage_dressing}
              {#if version === 'hallway'}
                <span class="differential">{calculateDifferential(sketch, sortedSketches[index - 1])}</span>
              {/if}
            </div>
          {:else if version === 'hallway'}
            <div class="detail">
              <strong>Stage:</strong> <span class="differential">{calculateDifferential(sketch, sortedSketches[index - 1])}</span>
            </div>
          {/if}
        </div>

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

  .differential {
    color: #000;
    font-weight: bold;
    font-style: normal;
    margin-left: 0.5rem;
    font-size: 10pt;
  }

  @media print {
    @page {
      size: A4;
      margin: 0.5cm;
    }

    .print-container {
      padding: 0;
    }

    .sketch {
      break-inside: avoid;
    }
  }
</style>
