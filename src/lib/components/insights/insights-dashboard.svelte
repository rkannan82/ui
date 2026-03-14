<script lang="ts">
  import Badge from '$lib/holocene/badge.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import type { InsightsSummary } from '$lib/services/insights-service';

  import InsightCard from './insight-card.svelte';

  interface Props {
    summary: InsightsSummary;
    namespace: string;
  }

  let { summary, namespace }: Props = $props();

  let severityFilter = $state<'all' | 'critical' | 'warning'>('all');

  let filteredInsights = $derived(
    severityFilter === 'all'
      ? summary.allInsights
      : summary.allInsights.filter((i) => i.severity === severityFilter),
  );

  let hasIssues = $derived(summary.allInsights.length > 0);

  function setFilter(filter: 'all' | 'critical' | 'warning') {
    severityFilter = severityFilter === filter ? 'all' : filter;
  }

  function scrollToIssues() {
    document
      .getElementById('active-issues')
      ?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<div class="flex flex-col gap-6">
  <div class="flex items-start justify-between">
    <div>
      <h1 class="flex items-center gap-3 text-2xl font-bold text-primary">
        <Icon name="eye-show" />
        Insights
      </h1>
      <p class="mt-1 text-sm text-secondary">
        Scanned {summary.results.length} task queue{summary.results.length !== 1
          ? 's'
          : ''} in
        <span class="font-mono">{namespace}</span>
      </p>
    </div>
  </div>

  {#if hasIssues}
    <!-- Status bar: only show when there are problems -->
    <div class="flex items-center gap-3">
      {#if summary.criticalCount > 0}
        <button
          class="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-left transition-all duration-150 {severityFilter ===
          'critical'
            ? 'border-red-400 bg-red-50 ring-2 ring-red-500 dark:bg-red-950'
            : 'surface-primary hover:ring-2 hover:ring-red-300'} cursor-pointer"
          onclick={() => {
            setFilter('critical');
            scrollToIssues();
          }}
        >
          <Icon name="error" />
          <span class="text-xl font-bold text-primary"
            >{summary.criticalCount}</span
          >
          <span class="text-sm text-secondary">Critical</span>
        </button>
      {/if}
      {#if summary.warningCount > 0}
        <button
          class="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-left transition-all duration-150 {severityFilter ===
          'warning'
            ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-500 dark:bg-yellow-950'
            : 'surface-primary hover:ring-2 hover:ring-yellow-300'} cursor-pointer"
          onclick={() => {
            setFilter('warning');
            scrollToIssues();
          }}
        >
          <Icon name="warning" />
          <span class="text-xl font-bold text-primary"
            >{summary.warningCount}</span
          >
          <span class="text-sm text-secondary">Warnings</span>
        </button>
      {/if}
      {#if severityFilter !== 'all'}
        <button
          class="ml-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
          onclick={() => (severityFilter = 'all')}
        >
          Show all
        </button>
      {/if}
    </div>
  {/if}

  <!-- Active Issues -->
  <div id="active-issues">
    {#if !hasIssues}
      <div
        class="rounded-lg border border-green-300 bg-green-50 p-8 text-center dark:border-green-700 dark:bg-green-950"
      >
        <div class="mb-3 text-4xl">&#10003;</div>
        <h2 class="text-lg font-semibold text-primary">All Systems Healthy</h2>
        <p class="mt-1 text-sm text-secondary">
          No issues detected across {summary.results.length} task queue{summary
            .results.length !== 1
            ? 's'
            : ''} in this namespace.
        </p>
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#each filteredInsights as insight, i}
          <InsightCard
            {insight}
            autoExpand={i === 0 && insight.severity === 'critical'}
          />
        {/each}
      </div>
    {/if}
  </div>

  <!-- Workflow Health Summary -->
  {#if summary.workflowHealth}
    {@const wf = summary.workflowHealth}
    <div class="surface-primary rounded-lg border p-5">
      <h2
        class="mb-4 flex items-center gap-2 text-base font-semibold text-primary"
      >
        <Icon name="workflow" />
        Workflow Health
      </h2>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="rounded-md bg-slate-50 p-3 text-center dark:bg-slate-800">
          <div class="text-xl font-bold text-primary">{wf.runningCount}</div>
          <div class="text-xs text-secondary">Running</div>
        </div>
        <div
          class="rounded-md p-3 text-center"
          class:bg-red-50={wf.failedCount > 0}
          class:dark:bg-red-950={wf.failedCount > 0}
          class:bg-slate-50={wf.failedCount === 0}
          class:dark:bg-slate-800={wf.failedCount === 0}
        >
          {#if wf.failedCount > 0}
            <a
              href="/namespaces/{namespace}/workflows?status=Failed"
              class="block hover:opacity-80"
            >
              <div class="text-xl font-bold text-red-600 dark:text-red-400">
                {wf.failedCount}
              </div>
              <div class="text-xs text-secondary underline">Failed</div>
            </a>
          {:else}
            <div class="text-xl font-bold text-primary">0</div>
            <div class="text-xs text-secondary">Failed</div>
          {/if}
        </div>
        <div
          class="rounded-md p-3 text-center"
          class:bg-yellow-50={wf.taskFailureCount > 0}
          class:dark:bg-yellow-950={wf.taskFailureCount > 0}
          class:bg-slate-50={wf.taskFailureCount === 0}
          class:dark:bg-slate-800={wf.taskFailureCount === 0}
        >
          <div
            class="text-xl font-bold"
            class:text-yellow-600={wf.taskFailureCount > 0}
            class:dark:text-yellow-400={wf.taskFailureCount > 0}
            class:text-primary={wf.taskFailureCount === 0}
          >
            {wf.taskFailureCount}
          </div>
          <div class="text-xs text-secondary">Task Failures</div>
        </div>
        <div
          class="rounded-md p-3 text-center"
          class:bg-orange-50={wf.timedOutCount > 0}
          class:dark:bg-orange-950={wf.timedOutCount > 0}
          class:bg-slate-50={wf.timedOutCount === 0}
          class:dark:bg-slate-800={wf.timedOutCount === 0}
        >
          <div
            class="text-xl font-bold"
            class:text-orange-600={wf.timedOutCount > 0}
            class:dark:text-orange-400={wf.timedOutCount > 0}
            class:text-primary={wf.timedOutCount === 0}
          >
            {wf.timedOutCount}
          </div>
          <div class="text-xs text-secondary">Timed Out</div>
        </div>
      </div>
      {#if wf.failedCount > 0 || wf.taskFailureCount > 0 || wf.timedOutCount > 0}
        <div class="mt-3 text-xs text-secondary">
          {wf.completedCount} completed &middot; {wf.canceledCount} canceled &middot;
          {wf.terminatedCount} terminated &middot; {wf.totalCount} total
        </div>
      {/if}
    </div>
  {/if}
</div>
