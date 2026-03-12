<script lang="ts">
  import { goto } from '$app/navigation';

  import ServerlessWorkerDetailSkeleton from '$lib/components/workers/serverless-worker-detail-skeleton.svelte';
  import ServerlessWorkerStatus from '$lib/components/workers/serverless-worker-status.svelte';
  import Alert from '$lib/holocene/alert.svelte';
  import Button from '$lib/holocene/button.svelte';
  import Card from '$lib/holocene/card.svelte';
  import CopyButton from '$lib/holocene/copyable/button.svelte';
  import Link from '$lib/holocene/link.svelte';
  import Modal from '$lib/holocene/modal.svelte';
  import { translate } from '$lib/i18n/translate';
  import {
    deleteServerlessWorker,
    getServerlessWorker,
  } from '$lib/services/serverless-worker-service';
  import { copyToClipboard } from '$lib/utilities/copy-to-clipboard';
  import {
    routeForServerlessWorkerEdit,
    routeForWorkers,
  } from '$lib/utilities/route-for';

  type Props = { id: string; namespace: string; loading?: boolean };
  let { id, namespace, loading = false }: Props = $props();

  const worker = $derived(getServerlessWorker(id));
  let showDeleteModal = $state(false);

  const { copy: copyLambda, copied: lambdaCopied } = copyToClipboard();
  const { copy: copyIam, copied: iamCopied } = copyToClipboard();
  const { copy: copyTaskQueue, copied: taskQueueCopied } = copyToClipboard();

  function parseLambdaArn(arn: string) {
    const parts = arn.split(':');
    return { region: parts[3], functionName: parts[6] };
  }

  function parseIamRoleArn(arn: string) {
    const parts = arn.split('/');
    return { roleName: parts[parts.length - 1] };
  }

  function handleDelete() {
    deleteServerlessWorker(id);
    goto(routeForWorkers({ namespace }));
  }
</script>

{#if loading}
  <ServerlessWorkerDetailSkeleton />
{:else if !worker}
  <Alert intent="warning" title="Serverless worker not found">
    No serverless worker found with ID "{id}".
  </Alert>
{:else}
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-semibold">{worker.name}</h2>
        <ServerlessWorkerStatus status={worker.status} />
      </div>
      <div class="flex gap-2">
        <Button href={routeForServerlessWorkerEdit({ namespace, id })}>
          {translate('workers.edit-serverless-worker')}
        </Button>
        <Button variant="destructive" on:click={() => (showDeleteModal = true)}>
          {translate('workers.delete-serverless-worker')}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <h3 class="mb-4 text-base font-semibold">Configuration</h3>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-secondary"
              >{translate('workers.lambda-arn')}</span
            >
            <div class="flex items-center gap-2">
              <span class="break-all font-mono text-sm text-primary"
                >{worker.lambdaArn}</span
              >
              <CopyButton
                copyIconTitle={translate('workers.copy-arn')}
                copySuccessIconTitle={translate('workers.copied')}
                copied={$lambdaCopied}
                on:click={(e) => copyLambda(e, worker.lambdaArn)}
              />
            </div>
            <Link
              href={`https://console.aws.amazon.com/lambda/home?region=${parseLambdaArn(worker.lambdaArn).region}#/functions/${parseLambdaArn(worker.lambdaArn).functionName}`}
              newTab
            >
              {translate('workers.open-lambda-console')}
            </Link>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-secondary"
              >{translate('workers.iam-role-arn')}</span
            >
            <div class="flex items-center gap-2">
              <span class="break-all font-mono text-sm text-primary"
                >{worker.iamRoleArn}</span
              >
              <CopyButton
                copyIconTitle={translate('workers.copy-arn')}
                copySuccessIconTitle={translate('workers.copied')}
                copied={$iamCopied}
                on:click={(e) => copyIam(e, worker.iamRoleArn)}
              />
            </div>
            <Link
              href={`https://console.aws.amazon.com/iam/home#/roles/${parseIamRoleArn(worker.iamRoleArn).roleName}`}
              newTab
            >
              {translate('workers.open-iam-console')}
            </Link>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-secondary"
              >{translate('workers.region')}</span
            >
            <span class="text-sm text-primary">{worker.region}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-secondary"
              >{translate('workers.task-queue')}</span
            >
            <div class="flex items-center gap-2">
              <span class="text-sm text-primary">{worker.taskQueue}</span>
              <CopyButton
                copyIconTitle={translate('workers.copy-task-queue')}
                copySuccessIconTitle={translate('workers.copied')}
                copied={$taskQueueCopied}
                on:click={(e) => copyTaskQueue(e, worker.taskQueue)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 class="mb-4 text-base font-semibold">
          {translate('workers.advanced-config')}
        </h3>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-secondary"
              >{translate('workers.max-workers')}</span
            >
            <span class="text-sm text-primary">{worker.maxWorkers}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-secondary"
              >{translate('workers.max-concurrent-activities')}</span
            >
            <span class="text-sm text-primary"
              >{worker.maxConcurrentActivities}</span
            >
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-secondary"
              >{translate('workers.max-task-queue-rate')}</span
            >
            <span class="text-sm text-primary"
              >{worker.maxTaskQueueActivitiesPerSecond}/s</span
            >
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-secondary"
              >{translate('workers.idle-timeout')}</span
            >
            <span class="text-sm text-primary"
              >{worker.idleTimeoutSeconds}s</span
            >
          </div>
        </div>

        <div class="mt-6 border-t border-subtle pt-4">
          <div class="flex flex-col gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-secondary"
                >{translate('workers.created-at')}</span
              >
              <span class="text-sm text-primary"
                >{new Date(worker.createdAt).toLocaleString()}</span
              >
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-secondary"
                >{translate('workers.updated-at')}</span
              >
              <span class="text-sm text-primary"
                >{new Date(worker.updatedAt).toLocaleString()}</span
              >
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>

  <Modal
    id="delete-serverless-worker-modal"
    open={showDeleteModal}
    confirmText={translate('workers.delete-serverless-worker')}
    cancelText={translate('common.cancel')}
    confirmType="destructive"
    on:confirmModal={handleDelete}
    on:cancelModal={() => (showDeleteModal = false)}
  >
    <h3 slot="title">{translate('workers.delete-serverless-worker')}</h3>
    <p slot="content">{translate('workers.delete-confirm')}</p>
  </Modal>
{/if}
