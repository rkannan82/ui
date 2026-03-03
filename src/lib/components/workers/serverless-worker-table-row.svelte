<script lang="ts">
  import Badge from '$lib/holocene/badge.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import {
    Menu,
    MenuButton,
    MenuContainer,
    MenuItem,
  } from '$lib/holocene/menu';
  import { translate } from '$lib/i18n/translate';
  import type { ServerlessWorker } from '$lib/types/serverless-workers';
  import {
    routeForServerlessWorker,
    routeForServerlessWorkerEdit,
  } from '$lib/utilities/route-for';

  type Props = {
    worker: ServerlessWorker;
    namespace: string;
    columns: { label: string }[];
  };

  let { worker, namespace, columns }: Props = $props();

  const detailHref = $derived(
    routeForServerlessWorker({ namespace, id: worker.id }),
  );
  const editHref = $derived(
    routeForServerlessWorkerEdit({ namespace, id: worker.id }),
  );
  const menuId = $derived(`serverless-worker-menu-${worker.id}`);
</script>

<tr>
  {#each columns as { label } (label)}
    {#if label === translate('workers.type')}
      <td
        ><Badge type="primary">{translate('workers.type-serverless')}</Badge
        ></td
      >
    {:else if label === translate('workers.status')}
      <td
        ><Badge type={worker.status === 'active' ? 'success' : 'warning'}
          >{worker.status}</Badge
        ></td
      >
    {:else if label === translate('workers.instance')}
      <td>
        <a href={detailHref} class="text-blue-700 hover:underline">
          {worker.name}
        </a>
      </td>
    {:else if label === translate('workers.task-queue')}
      <td>{worker.taskQueue}</td>
    {:else if label === translate('workers.identity')}
      <td class="font-mono text-xs">{worker.lambdaArn.split(':').pop()}</td>
    {:else if label === translate('workers.host-name')}
      <td>{worker.region}</td>
    {:else if label === ''}
      <td class="w-10 text-right">
        <MenuContainer>
          <MenuButton
            controls={menuId}
            hasIndicator={false}
            variant="ghost"
            size="xs"
          >
            <Icon name="vertical-ellipsis" />
          </MenuButton>
          <Menu id={menuId} position="right">
            <MenuItem href={detailHref}>
              {translate('common.view')}
            </MenuItem>
            <MenuItem href={editHref}>
              {translate('workers.edit-serverless-worker')}
            </MenuItem>
            <MenuItem destructive>
              {translate('common.delete')}
            </MenuItem>
          </Menu>
        </MenuContainer>
      </td>
    {:else}
      <td class="text-secondary">—</td>
    {/if}
  {/each}
</tr>
