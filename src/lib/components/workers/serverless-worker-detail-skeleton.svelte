<script lang="ts">
  import Card from '$lib/holocene/card.svelte';
  import Skeleton from '$lib/holocene/skeleton/index.svelte';
</script>

<div class="flex flex-col gap-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <Skeleton class="h-7 w-48" />
      <Skeleton class="h-5 w-20 rounded-sm" />
    </div>
    <div class="flex gap-2">
      <Skeleton class="h-9 w-16 rounded" />
      <Skeleton class="h-9 w-40 rounded" />
    </div>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <Card>
      <Skeleton class="mb-4 h-5 w-32" />
      <div class="flex flex-col gap-4">
        {#each Array(4) as _}
          <div class="flex flex-col gap-1">
            <Skeleton class="h-3 w-24" />
            <Skeleton class="h-4 w-full" />
          </div>
        {/each}
      </div>
    </Card>

    <Card>
      <Skeleton class="mb-4 h-5 w-48" />
      <div class="flex flex-col gap-4">
        {#each Array(4) as _}
          <div class="flex flex-col gap-1">
            <Skeleton class="h-3 w-24" />
            <Skeleton class="h-4 w-20" />
          </div>
        {/each}
      </div>
    </Card>
  </div>
</div>
