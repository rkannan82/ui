<script lang="ts">
  import { goto } from '$app/navigation';

  import Alert from '$lib/holocene/alert.svelte';
  import { translate } from '$lib/i18n/translate';
  import ServerlessWorkerForm from '$lib/pages/serverless-worker-form.svelte';
  import {
    deleteServerlessWorker,
    getServerlessWorker,
    updateServerlessWorker,
  } from '$lib/services/serverless-worker-service';
  import type { ServerlessWorkerUpdateInput } from '$lib/types/serverless-workers';
  import {
    routeForServerlessWorker,
    routeForWorkers,
  } from '$lib/utilities/route-for';

  type Props = { id: string; namespace: string };
  let { id, namespace }: Props = $props();

  const worker = $derived(getServerlessWorker(id));
  const detailHref = $derived(routeForServerlessWorker({ namespace, id }));

  function handleDelete() {
    deleteServerlessWorker(id);
    goto(routeForWorkers({ namespace }));
  }
</script>

{#if !worker}
  <Alert intent="warning" title="Serverless worker not found">
    No serverless worker found with ID "{id}".
  </Alert>
{:else}
  <ServerlessWorkerForm
    {namespace}
    {worker}
    submitButtonText={translate('workers.save-changes')}
    cancelHref={detailHref}
    onSubmit={(data) => {
      updateServerlessWorker(
        id,
        data as unknown as ServerlessWorkerUpdateInput,
      );
      goto(detailHref);
    }}
    onDelete={handleDelete}
  />
{/if}
