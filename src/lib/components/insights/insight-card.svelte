<script lang="ts">
  import Badge from '$lib/holocene/badge.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import type { TaskQueueInsight } from '$lib/utilities/triage-insights';

  interface Props {
    insight: TaskQueueInsight;
    autoExpand?: boolean;
  }

  let { insight, autoExpand = false }: Props = $props();

  let toggled = $state<boolean | null>(null);
  let expanded = $derived(toggled !== null ? toggled : autoExpand);

  const severityConfig = {
    critical: {
      border: 'border-red-400 dark:border-red-600',
      bg: 'bg-red-50 dark:bg-red-950',
      badge: 'danger' as const,
      icon: 'close' as const,
    },
    warning: {
      border: 'border-yellow-400 dark:border-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      badge: 'warning' as const,
      icon: 'warning' as const,
    },
    info: {
      border: 'border-blue-400 dark:border-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
      badge: 'primary' as const,
      icon: 'info' as const,
    },
  };

  const typeIcons: Record<string, string> = {
    NO_WORKERS: '⊘',
    WORKER_CRASHING: '↯',
    WORKER_UNHEALTHY: '↯',
    POLLER_SHORTAGE: '⬇',
    RATE_LIMITED: '⏱',
    SLOT_EXHAUSTION: '▣',
    WORKFLOW_FAILURES: '✕',
    WORKFLOW_TASK_FAILURES: '⚡',
  };

  let config = $derived(severityConfig[insight.severity]);
</script>

<div
  class="rounded-lg border-l-4 {config.border} {config.bg} overflow-hidden transition-all duration-200"
>
  <button
    class="flex w-full items-center gap-4 p-4 text-left hover:opacity-90"
    onclick={() => (toggled = !expanded)}
  >
    <span class="text-2xl" aria-hidden="true">
      {typeIcons[insight.type] ?? '?'}
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-base font-semibold text-primary">
          {insight.title}
        </h3>
        <Badge type={config.badge} class="px-1.5 py-0 text-xs">
          {insight.severity}
        </Badge>
      </div>
      <p class="mt-1 truncate text-sm text-secondary">
        {insight.detection}
      </p>
    </div>

    <div class="flex items-center gap-3">
      <span
        class="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs text-secondary dark:bg-slate-700"
      >
        {insight.taskQueue}
      </span>
      <span
        class="transform text-secondary transition-transform duration-200"
        class:rotate-180={expanded}
      >
        <Icon name="chevron-down" />
      </span>
    </div>
  </button>

  {#if expanded}
    <div class="space-y-4 border-t border-slate-200 p-4 dark:border-slate-700">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <h4
            class="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary"
          >
            Detection
          </h4>
          <p class="text-sm text-primary">{insight.detection}</p>
        </div>
        <div>
          <h4
            class="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary"
          >
            Root Cause
          </h4>
          <p class="text-sm text-primary">{insight.rootCause}</p>
        </div>
        <div>
          <h4
            class="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary"
          >
            Task Queue
          </h4>
          <p class="font-mono text-sm text-primary">{insight.taskQueue}</p>
        </div>
      </div>

      {#if insight.correlations?.length}
        <div
          class="rounded-md border border-purple-300 bg-purple-50 p-3 dark:border-purple-700 dark:bg-purple-950"
        >
          <h4
            class="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300"
          >
            Correlated Events
          </h4>
          <div class="space-y-2">
            {#each insight.correlations as correlation}
              <div class="flex items-start gap-2 text-sm">
                <span class="mt-0.5 text-purple-500">&#x25C6;</span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-medium text-primary"
                      >{correlation.event.title}</span
                    >
                    <span class="text-xs text-secondary"
                      >({correlation.timeDelta} ago)</span
                    >
                    <Badge
                      type={correlation.confidence === 'high'
                        ? 'danger'
                        : correlation.confidence === 'medium'
                          ? 'warning'
                          : 'primary'}
                      class="px-1.5 py-0 text-xs"
                    >
                      {correlation.confidence}
                    </Badge>
                  </div>
                  <p class="mt-0.5 text-xs text-secondary">
                    {correlation.explanation}
                  </p>
                  {#if correlation.event.details}
                    <div class="mt-1 flex flex-wrap gap-1.5">
                      {#each Object.entries(correlation.event.details) as [key, value]}
                        <span
                          class="rounded bg-purple-100 px-1.5 py-0.5 font-mono text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        >
                          {key}: {value}
                        </span>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if insight.stats}
        <div>
          <h4
            class="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary"
          >
            Metrics Snapshot
          </h4>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
            <div class="rounded bg-white p-3 text-center dark:bg-slate-800">
              <div class="text-lg font-bold text-primary">
                {insight.stats.backlogCount}
              </div>
              <div class="text-xs text-secondary">Backlog</div>
            </div>
            <div class="rounded bg-white p-3 text-center dark:bg-slate-800">
              <div class="text-lg font-bold text-primary">
                {insight.stats.backlogAge}
              </div>
              <div class="text-xs text-secondary">Oldest Task</div>
            </div>
            <div class="rounded bg-white p-3 text-center dark:bg-slate-800">
              <div class="text-lg font-bold text-primary">
                {insight.stats.tasksAddRate.toFixed(1)}/s
              </div>
              <div class="text-xs text-secondary">Add Rate</div>
            </div>
            <div class="rounded bg-white p-3 text-center dark:bg-slate-800">
              <div class="text-lg font-bold text-primary">
                {insight.stats.tasksDispatchRate.toFixed(1)}/s
              </div>
              <div class="text-xs text-secondary">Dispatch Rate</div>
            </div>
            <div class="rounded bg-white p-3 text-center dark:bg-slate-800">
              <div class="text-lg font-bold text-primary">
                {insight.stats.pollerCount}
              </div>
              <div class="text-xs text-secondary">Pollers</div>
            </div>
          </div>
        </div>
      {/if}

      {#if insight.affectedWorkers?.length}
        <div>
          <h4
            class="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary"
          >
            Affected Workers
          </h4>
          <div class="flex flex-wrap gap-2">
            {#each insight.affectedWorkers as worker}
              <span
                class="rounded bg-red-100 px-2 py-0.5 font-mono text-xs text-red-800 dark:bg-red-900 dark:text-red-200"
              >
                {worker}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <div>
        <h4
          class="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary"
        >
          Suggested Remediation
        </h4>
        <div class="flex flex-wrap gap-2">
          {#each insight.remediations as remediation}
            {#if remediation.action === 'view-logs'}
              <button
                class="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Icon name="search" />
                {remediation.label}
              </button>
            {:else if remediation.action === 'send-signal'}
              <button
                class="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <Icon name="signal" />
                {remediation.label}
              </button>
            {:else}
              <span
                class="inline-flex items-center gap-1 rounded-md bg-slate-200 px-3 py-1.5 text-sm text-primary dark:bg-slate-700"
              >
                {remediation.label}
              </span>
            {/if}
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
