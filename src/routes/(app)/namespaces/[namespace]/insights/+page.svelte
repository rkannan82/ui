<script lang="ts">
  import { BROWSER } from 'esm-env';
  import { onMount } from 'svelte';

  import { page } from '$app/state';

  import InsightsDashboard from '$lib/components/insights/insights-dashboard.svelte';
  import PageTitle from '$lib/components/page-title.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import {
    getInsightsSummary,
    type InsightsSummary,
  } from '$lib/services/insights-service';

  const namespace = $derived(page.params.namespace);

  let filterInput = $state('');
  let filterQueues = $state<string[]>([]);
  let insightsSummary = $state<InsightsSummary | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let lastScannedAt = $state<Date | null>(null);
  let showFilter = $state(false);

  onMount(() => {
    filterQueues = loadSavedFilters();
    runScan();
  });

  function loadSavedFilters(): string[] {
    if (!BROWSER) return [];
    try {
      const saved = localStorage.getItem(`insights-filter-${namespace}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  function saveFilters() {
    if (!BROWSER) return;
    try {
      localStorage.setItem(
        `insights-filter-${namespace}`,
        JSON.stringify(filterQueues),
      );
    } catch {
      // localStorage unavailable
    }
  }

  function addFilter() {
    const name = filterInput.trim();
    if (name && !filterQueues.includes(name)) {
      filterQueues = [...filterQueues, name];
      filterInput = '';
      saveFilters();
    }
  }

  function removeFilter(name: string) {
    filterQueues = filterQueues.filter((q) => q !== name);
    saveFilters();
  }

  function clearFilters() {
    filterQueues = [];
    saveFilters();
    runScan();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      addFilter();
    }
  }

  async function runScan() {
    loading = true;
    error = null;
    try {
      insightsSummary = await getInsightsSummary(
        namespace,
        filterQueues.length > 0 ? filterQueues : undefined,
      );
      lastScannedAt = new Date();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to fetch insights data';
      insightsSummary = null;
    } finally {
      loading = false;
    }
  }
</script>

<PageTitle title={`Insights | ${namespace}`} url={page.url.href} />

<div class="flex flex-col gap-6">
  <!-- Top bar: refresh + filter toggle -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <button
        class="surface-interactive inline-flex items-center gap-2 rounded-md border-transparent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        onclick={runScan}
        disabled={loading}
      >
        {#if loading}
          <Icon name="spinner" />
          Scanning...
        {:else}
          <Icon name="retry" />
          Refresh
        {/if}
      </button>
      {#if lastScannedAt}
        <span class="text-xs text-secondary">
          Last scanned: {lastScannedAt.toLocaleTimeString()}
        </span>
      {/if}
    </div>
    <button
      class="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
      onclick={() => (showFilter = !showFilter)}
    >
      <Icon name="filter" />
      {filterQueues.length > 0
        ? `Filtered (${filterQueues.length})`
        : 'Filter by queue'}
    </button>
  </div>

  <!-- Optional filter panel -->
  {#if showFilter}
    <div class="surface-primary rounded-lg border p-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm text-secondary">
          Narrow results to specific task queues. Leave empty to scan all.
        </p>
        {#if filterQueues.length > 0}
          <button
            class="text-xs text-blue-600 hover:underline dark:text-blue-400"
            onclick={clearFilters}
          >
            Clear all
          </button>
        {/if}
      </div>
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={filterInput}
          onkeydown={handleKeydown}
          placeholder="Task queue name..."
          class="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-primary placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
        />
        <button
          class="surface-interactive rounded-md border-transparent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          onclick={() => {
            addFilter();
            runScan();
          }}
          disabled={!filterInput.trim()}
        >
          Add & Scan
        </button>
      </div>
      {#if filterQueues.length > 0}
        <div class="mt-3 flex flex-wrap gap-2">
          {#each filterQueues as queue}
            <span
              class="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 font-mono text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {queue}
              <button
                class="ml-1 hover:text-red-600 dark:hover:text-red-400"
                onclick={() => {
                  removeFilter(queue);
                  runScan();
                }}
                aria-label="Remove {queue}"
              >
                <Icon name="close" />
              </button>
            </span>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if error}
    <div
      class="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950"
    >
      <p class="text-sm text-red-800 dark:text-red-200">{error}</p>
    </div>
  {/if}

  {#if loading && !insightsSummary}
    <div class="flex animate-pulse flex-col gap-6">
      <div class="flex flex-col gap-3">
        {#each Array(3) as _}
          <div class="surface-primary rounded-lg border p-4">
            <div class="flex items-center gap-4">
              <div class="h-8 w-8 rounded bg-slate-200 dark:bg-slate-700"></div>
              <div class="flex-1">
                <div
                  class="mb-2 h-5 w-48 rounded bg-slate-200 dark:bg-slate-700"
                ></div>
                <div
                  class="h-3 w-72 rounded bg-slate-200 dark:bg-slate-700"
                ></div>
              </div>
              <div
                class="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else if insightsSummary}
    <InsightsDashboard summary={insightsSummary} {namespace} />
  {/if}
</div>
