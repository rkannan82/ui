<script lang="ts">
  import { page } from '$app/state';

  import PageTitle from '$lib/components/page-title.svelte';
  import Link from '$lib/holocene/link.svelte';
  import { translate } from '$lib/i18n/translate';
  import ServerlessWorkerDetail from '$lib/pages/serverless-worker-detail.svelte';
  import { routeForWorkers } from '$lib/utilities/route-for';

  const namespace = $derived(page.params.namespace);
  const id = $derived(page.params.id);
</script>

<PageTitle
  title={translate('workers.serverless-detail-title')}
  url={page.url.href}
/>

<header class="flex flex-col gap-2">
  <Link
    href={routeForWorkers({ namespace })}
    data-testid="back-to-workers"
    icon="chevron-left"
  >
    {translate('workers.back-to-workers')}
  </Link>
</header>

<ServerlessWorkerDetail {id} {namespace} />
