<script lang="ts">
  import Timestamp from '$lib/components/timestamp.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import {
    Menu,
    MenuButton,
    MenuContainer,
    MenuItem,
  } from '$lib/holocene/menu';
  import { translate } from '$lib/i18n/translate';
  import { deleteServerlessWorker } from '$lib/services/serverless-worker-service';
  import type { ServerlessWorker } from '$lib/types/serverless-workers';
  import {
    routeForServerlessWorker,
    routeForServerlessWorkerEdit,
  } from '$lib/utilities/route-for';

  import DeleteWorkerModal from './delete-worker-modal.svelte';
  import ServerlessWorkerStatus from './serverless-worker-status.svelte';

  type Props = {
    worker: ServerlessWorker;
    namespace: string;
    columns: { label: string }[];
  };

  let { worker, namespace, columns }: Props = $props();
  let showDeleteModal = $state(false);

  function handleDelete() {
    deleteServerlessWorker(worker.id);
    showDeleteModal = false;
  }

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
            <MenuItem destructive onclick={() => (showDeleteModal = true)}>
              {translate('common.delete')}
            </MenuItem>
          </Menu>
        </MenuContainer>
      </td>
    {:else}
      <td></td>
    {/if}
  {/each}
</tr>

<DeleteWorkerModal
  open={showDeleteModal}
  workerName={worker.name}
  on:confirmModal={handleDelete}
  on:cancelModal={() => (showDeleteModal = false)}
/>
