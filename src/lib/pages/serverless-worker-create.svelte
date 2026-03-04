<script lang="ts">
  import { translate } from '$lib/i18n/translate';
  import ServerlessWorkerForm from '$lib/pages/serverless-worker-form.svelte';
  import { createServerlessWorker } from '$lib/services/serverless-worker-service';
  import type { ServerlessWorkerCreateInput } from '$lib/types/serverless-workers';
  import { routeForWorkers } from '$lib/utilities/route-for';

  type Props = {
    namespace: string;
    onSuccess: () => void;
  };

  let { namespace, onSuccess }: Props = $props();
</script>

<ServerlessWorkerForm
  {namespace}
  submitButtonText={translate('workers.create-serverless-worker')}
  cancelHref={routeForWorkers({ namespace })}
  onSubmit={(data) => {
    createServerlessWorker(data as unknown as ServerlessWorkerCreateInput);
    onSuccess();
  }}
/>
