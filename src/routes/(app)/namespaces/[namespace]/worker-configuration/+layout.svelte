<script lang="ts">
  import { page } from '$app/state';

  import type { LayoutProps } from './$types';

  import PageTitle from '$lib/components/page-title.svelte';
  import TabList from '$lib/holocene/tab/tab-list.svelte';
  import Tab from '$lib/holocene/tab/tab.svelte';
  import Tabs from '$lib/holocene/tab/tabs.svelte';
  import VerticalNavItem from '$lib/holocene/vertical-nav/vertical-nav-item.svelte';
  import VerticalNav from '$lib/holocene/vertical-nav/vertical-nav.svelte';
  import { translate } from '$lib/i18n/translate';
  import { pathMatches } from '$lib/utilities/path-matches';
  import {
    routeForWorkerConfiguration,
    routeForWorkerDeployments,
    routeForWorkers,
  } from '$lib/utilities/route-for';

  let { children }: LayoutProps = $props();

  const { namespace } = $derived(page.params);

  const workersHref = $derived(routeForWorkers({ namespace }));
  const deploymentsHref = $derived(routeForWorkerDeployments({ namespace }));
  const configurationHref = $derived(
    routeForWorkerConfiguration({ namespace }),
  );
  const serverlessHref = $derived(`${configurationHref}/serverless`);

  const activeNavItem = $derived.by(() => {
    if (pathMatches(serverlessHref, page.url.pathname)) return 'serverless';
    return 'serverless';
  });
</script>

<PageTitle title={translate('workers.configuration')} url={page.url.href} />
<header class="flex flex-col gap-2">
  <div class="flex flex-wrap items-center gap-2">
    <h1 class="leading-7" data-cy="configuration-title">
      {translate('workers.configuration')}
    </h1>
  </div>
  <Tabs>
    <TabList label={translate('workers.worker-views')}>
      <Tab
        label={translate('workers.workers')}
        id="workers-tab"
        href={workersHref}
        active={false}
      />
      <Tab
        label={translate('deployments.deployments')}
        id="deployments-tab"
        href={deploymentsHref}
        active={false}
      />
      <Tab
        label={translate('workers.configuration')}
        id="configuration-tab"
        href={configurationHref}
        active={true}
      />
    </TabList>
  </Tabs>
</header>

<div class="mt-4 flex min-h-full">
  <div class="w-64 border-r border-subtle pr-4">
    <VerticalNav
      aria-label={translate('workers.configuration')}
      activeItemId={activeNavItem}
    >
      <VerticalNavItem
        id="serverless"
        href={serverlessHref}
        label={translate('workers.config-serverless')}
        leadingIcon="lightning-bolt"
      />
      <VerticalNavItem
        id="general"
        href="#"
        label={translate('workers.config-general')}
        leadingIcon="settings"
        disabled
      />
      <VerticalNavItem
        id="policies"
        href="#"
        label={translate('workers.config-policies')}
        leadingIcon="lock"
        disabled
      />
      <VerticalNavItem
        id="alerts"
        href="#"
        label={translate('workers.config-alerts')}
        leadingIcon="warning"
        disabled
      />
    </VerticalNav>
  </div>
  <div class="flex-1 pl-6">
    {@render children()}
  </div>
</div>
