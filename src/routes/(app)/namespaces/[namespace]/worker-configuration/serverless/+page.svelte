<script lang="ts">
  import { page } from '$app/state';

  import Badge from '$lib/holocene/badge.svelte';
  import Button from '$lib/holocene/button.svelte';
  import EmptyState from '$lib/holocene/empty-state.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import {
    Menu,
    MenuButton,
    MenuContainer,
    MenuItem,
  } from '$lib/holocene/menu';
  import { translate } from '$lib/i18n/translate';
  import { getServerlessWorkers } from '$lib/services/serverless-worker-service';
  import {
    routeForServerlessWorker,
    routeForServerlessWorkerEdit,
  } from '$lib/utilities/route-for';

  const { namespace } = $derived(page.params);
  const workers = $derived(getServerlessWorkers());
  const createHref = $derived(`${page.url.pathname}/create`);
</script>

<div class="mb-4 flex items-center justify-between">
  <div>
    <h2 class="text-lg font-semibold">
      {translate('workers.serverless-workers')}
    </h2>
    <p class="text-sm text-secondary">
      {translate('workers.serverless-workers-description')}
    </p>
  </div>
  <Button href={createHref}>
    {translate('workers.create-serverless-worker')}
  </Button>
</div>

{#if workers.length === 0}
  <EmptyState title={translate('workers.serverless-empty-state')}>
    <p>{translate('workers.serverless-empty-state-description')}</p>
  </EmptyState>
{:else}
  <table class="w-full">
    <thead>
      <tr class="border-b border-subtle text-left">
        <th class="pb-2">{translate('workers.name-label')}</th>
        <th class="pb-2">{translate('workers.status')}</th>
        <th class="pb-2">{translate('workers.task-queue')}</th>
        <th class="pb-2">{translate('workers.region')}</th>
        <th class="pb-2">{translate('workers.lambda-arn')}</th>
        <th class="w-10 pb-2"></th>
      </tr>
    </thead>
    <tbody>
      {#each workers as worker (worker.id)}
        <tr class="border-b border-subtle hover:bg-interactive-secondary-hover">
          <td class="py-2">
            <a
              href={routeForServerlessWorker({ namespace, id: worker.id })}
              class="text-blue-700 hover:underline"
            >
              {worker.name}
            </a>
          </td>
          <td class="py-2">
            <Badge type={worker.status === 'active' ? 'success' : 'warning'}>
              {worker.status}
            </Badge>
          </td>
          <td class="py-2">{worker.taskQueue}</td>
          <td class="py-2">{worker.region}</td>
          <td class="py-2 font-mono text-xs">{worker.lambdaArn}</td>
          <td class="py-2 text-right">
            <MenuContainer>
              <MenuButton
                controls={`serverless-config-menu-${worker.id}`}
                hasIndicator={false}
                variant="ghost"
                size="xs"
              >
                <Icon name="vertical-ellipsis" />
              </MenuButton>
              <Menu id={`serverless-config-menu-${worker.id}`} position="right">
                <MenuItem
                  href={routeForServerlessWorker({ namespace, id: worker.id })}
                >
                  {translate('common.view')}
                </MenuItem>
                <MenuItem
                  href={routeForServerlessWorkerEdit({
                    namespace,
                    id: worker.id,
                  })}
                >
                  {translate('workers.edit-serverless-worker')}
                </MenuItem>
                <MenuItem destructive>
                  {translate('common.delete')}
                </MenuItem>
              </Menu>
            </MenuContainer>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
