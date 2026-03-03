<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import PageTitle from '$lib/components/page-title.svelte';
  import Link from '$lib/holocene/link.svelte';
  import { translate } from '$lib/i18n/translate';
  import ServerlessWorkerCreate from '$lib/pages/serverless-worker-create.svelte';
  import { routeForWorkerConfiguration } from '$lib/utilities/route-for';

  const namespace = $derived(page.params.namespace);
  const backHref = $derived(
    `${routeForWorkerConfiguration({ namespace })}/serverless`,
  );
</script>

<PageTitle
  title={translate('workers.create-serverless-title')}
  url={page.url.href}
/>

<header class="mb-4 flex flex-col gap-2">
  <Link href={backHref} icon="chevron-left">
    {translate('workers.back-to-configuration')}
  </Link>
  <h1 class="text-xl font-semibold">
    {translate('workers.create-serverless-title')}
  </h1>
</header>

<ServerlessWorkerCreate {namespace} onSuccess={() => goto(backHref)} />
