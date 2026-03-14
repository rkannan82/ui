<script lang="ts">
  import Icon from '$lib/holocene/icon/icon.svelte';
  import type { TimelineEvent } from '$lib/services/insights-service';

  interface Props {
    events: TimelineEvent[];
    windowMinutes?: number;
  }

  let { events, windowMinutes = 30 }: Props = $props();

  const eventTypeConfig: Record<
    string,
    { label: string; color: string; bg: string; icon: string }
  > = {
    DEPLOY: {
      label: 'Deploy',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500',
      icon: 'rocket-ship',
    },
    CONFIG_CHANGE: {
      label: 'Config',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500',
      icon: 'settings',
    },
    RELEASE: {
      label: 'Release',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500',
      icon: 'arrow-up',
    },
    TRAFFIC_SPIKE: {
      label: 'Traffic',
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500',
      icon: 'lightning-bolt',
    },
    INCIDENT: {
      label: 'Incident',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500',
      icon: 'warning',
    },
  };

  let activeFilters = $state<Set<string>>(new Set());
  let hoveredEvent = $state<TimelineEvent | null>(null);

  const allTypes = $derived([...new Set(events.map((e) => e.type))].sort());

  const filteredEvents = $derived(
    activeFilters.size === 0
      ? events
      : events.filter((e) => activeFilters.has(e.type)),
  );

  function toggleFilter(type: string) {
    const next = new Set(activeFilters);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    activeFilters = next;
  }

  function eventPosition(event: TimelineEvent): number {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const eventTime = new Date(event.timestamp).getTime();
    const elapsed = now - eventTime;
    const pct = Math.max(0, Math.min(100, 100 - (elapsed / windowMs) * 100));
    return pct;
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function formatAgo(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  }

  function getConfig(type: string) {
    return (
      eventTypeConfig[type] ?? {
        label: type,
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-500',
        icon: 'info',
      }
    );
  }

  const timeMarkers = $derived(() => {
    const markers = [];
    const steps = [0, 0.25, 0.5, 0.75, 1];
    for (const s of steps) {
      const mins = Math.round(windowMinutes * (1 - s));
      markers.push({
        pct: s * 100,
        label: mins === 0 ? 'now' : `${mins}m ago`,
      });
    }
    return markers;
  });
</script>

{#if events.length > 0}
  <div class="surface-primary rounded-lg border p-4">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-primary">Event Timeline</h3>
      <div class="flex items-center gap-2">
        {#each allTypes as type}
          {@const cfg = getConfig(type)}
          <button
            class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-all {activeFilters.size ===
              0 || activeFilters.has(type)
              ? `${cfg.color} border-current opacity-100`
              : 'border-slate-300 text-slate-400 opacity-50 dark:border-slate-600'}"
            onclick={() => toggleFilter(type)}
          >
            <Icon name={cfg.icon} />
            {cfg.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Timeline bar -->
    <div class="relative">
      <!-- Time axis labels -->
      <div class="relative mb-1 h-4">
        {#each timeMarkers() as marker}
          <span
            class="absolute -translate-x-1/2 text-[10px] text-slate-400"
            style="left: {marker.pct}%"
          >
            {marker.label}
          </span>
        {/each}
      </div>

      <!-- Track -->
      <div class="relative h-10 rounded-md bg-slate-100 dark:bg-slate-800">
        <!-- Grid lines -->
        {#each timeMarkers() as marker}
          <div
            class="absolute top-0 h-full w-px bg-slate-200 dark:bg-slate-700"
            style="left: {marker.pct}%"
          ></div>
        {/each}

        <!-- Event markers -->
        {#each filteredEvents as event}
          {@const cfg = getConfig(event.type)}
          {@const pos = eventPosition(event)}
          <button
            class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125"
            style="left: {pos}%"
            onmouseenter={() => (hoveredEvent = event)}
            onmouseleave={() => (hoveredEvent = null)}
          >
            <div
              class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-sm dark:border-slate-900 {cfg.bg}"
            >
              <span class="text-white" style="font-size: 12px;">
                <Icon name={cfg.icon} />
              </span>
            </div>
          </button>
        {/each}
      </div>

      <!-- Tooltip -->
      {#if hoveredEvent}
        {@const cfg = getConfig(hoveredEvent.type)}
        {@const pos = eventPosition(hoveredEvent)}
        <div
          class="absolute z-10 mt-2 w-64 rounded-lg border bg-white p-3 shadow-lg dark:border-slate-600 dark:bg-slate-800"
          style="left: clamp(0%, {pos}% - 128px, calc(100% - 256px))"
        >
          <div class="flex items-center gap-2">
            <span class={cfg.color}>
              <Icon name={cfg.icon} />
            </span>
            <span class="text-sm font-semibold text-primary">
              {hoveredEvent.title}
            </span>
          </div>
          <div class="mt-1.5 space-y-1 text-xs text-secondary">
            <div>
              {formatTime(hoveredEvent.timestamp)} ({formatAgo(
                hoveredEvent.timestamp,
              )})
            </div>
            {#if hoveredEvent.resourceId}
              <div>
                Resource: <span class="font-mono"
                  >{hoveredEvent.resourceId}</span
                >
              </div>
            {/if}
            {#if hoveredEvent.details}
              <div class="mt-1.5 flex flex-wrap gap-1">
                {#each Object.entries(hoveredEvent.details) as [key, value]}
                  <span
                    class="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-700"
                  >
                    {key}: {value}
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
