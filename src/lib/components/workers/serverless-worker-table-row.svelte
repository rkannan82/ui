<script lang="ts">
  import Timestamp from '$lib/components/timestamp.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import { translate } from '$lib/i18n/translate';
  import type { ServerlessWorker } from '$lib/types/serverless-workers';
  import { routeForServerlessWorker } from '$lib/utilities/route-for';

  import ServerlessWorkerStatus from './serverless-worker-status.svelte';

  type Props = {
    worker: ServerlessWorker;
    namespace: string;
    columns: { label: string }[];
  };

  let { worker, namespace, columns }: Props = $props();

  const detailHref = $derived(
    routeForServerlessWorker({ namespace, id: worker.id }),
  );
</script>

<tr>
  {#each columns as { label } (label)}
    {#if label === translate('workers.status')}
      <td><ServerlessWorkerStatus status={worker.status} /></td>
    {:else if label === translate('workers.name')}
      <td
        ><a href={detailHref} class="text-blue-700 hover:underline"
          >{worker.name}</a
        ></td
      >
    {:else if label === translate('workers.task-queue')}
      <td>{worker.taskQueue}</td>
    {:else if label === translate('workers.compute')}
      <td>
        <div class="flex items-center gap-1.5">
          <Icon name="robot" />
          <span>{worker.compute}</span>
        </div>
      </td>
    {:else if label === translate('workers.last-heartbeat')}
      <td><Timestamp dateTime={worker.lastHeartbeat} /></td>
    {:else if label === translate('workers.sdk-version')}
      <td>{worker.sdkVersion}</td>
    {:else}
      <td></td>
    {/if}
  {/each}
</tr>
