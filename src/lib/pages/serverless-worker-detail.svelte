<script lang="ts">
  import { goto } from '$app/navigation';

  import Timestamp from '$lib/components/timestamp.svelte';
  import DeleteWorkerModal from '$lib/components/workers/delete-worker-modal.svelte';
  import ServerlessWorkerDetailSkeleton from '$lib/components/workers/serverless-worker-detail-skeleton.svelte';
  import ServerlessWorkerStatus from '$lib/components/workers/serverless-worker-status.svelte';
  import Alert from '$lib/holocene/alert.svelte';
  import Button from '$lib/holocene/button.svelte';
  import Card from '$lib/holocene/card.svelte';
  import CopyButton from '$lib/holocene/copyable/button.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import Link from '$lib/holocene/link.svelte';
  import { translate } from '$lib/i18n/translate';
  import {
    deleteServerlessWorker,
    getServerlessWorker,
  } from '$lib/services/serverless-worker-service';
  import { copyToClipboard } from '$lib/utilities/copy-to-clipboard';
  import {
    routeForServerlessWorkerEdit,
    routeForWorkers,
    routeForWorkflowsWithQuery,
  } from '$lib/utilities/route-for';

  type Props = { id: string; namespace: string; loading?: boolean };
  let { id, namespace, loading = false }: Props = $props();

  const worker = $derived(getServerlessWorker(id));
  let showDeleteModal = $state(false);

  const { copy: copyLambda, copied: lambdaCopied } = copyToClipboard();
  const { copy: copyIam, copied: iamCopied } = copyToClipboard();

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
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <ServerlessWorkerStatus status={worker.status} />
          <h2 class="text-xl font-semibold">{worker.name}</h2>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <Link href={routeForWorkers({ namespace })}>
            {translate('workers.back-to-workers')}
          </Link>
          <Link
            href={routeForWorkflowsWithQuery({
              namespace,
              query: `TaskQueue="${worker.taskQueue}"`,
            })}
          >
            {translate('workers.go-to-workflows')}
          </Link>
        </div>
      </div>
      <Button href={routeForServerlessWorkerEdit({ namespace, id })}>
        {translate('workers.edit-serverless-worker')}
      </Button>
    </div>

    <div class="flex items-center gap-6 border-b border-subtle pb-4">
      <div class="flex flex-col gap-0.5">
        <span class="text-xs text-secondary"
          >{translate('workers.task-queue')}</span
        >
        <span class="text-sm font-medium">{worker.taskQueue}</span>
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-xs text-secondary"
          >{translate('workers.compute-label')}</span
        >
        <div class="flex items-center gap-1.5">
          <Icon name="robot" />
          <span class="text-sm font-medium">{worker.compute}</span>
        </div>
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-xs text-secondary"
          >{translate('workers.last-heartbeat-label')}</span
        >
        <span class="text-sm font-medium"
          ><Timestamp dateTime={worker.lastHeartbeat} /></span
        >
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-xs text-secondary"
          >{translate('workers.created-at')}</span
        >
        <span class="text-sm font-medium"
          ><Timestamp dateTime={worker.createdAt} /></span
        >
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-xs text-secondary"
          >{translate('workers.sdk-label')}</span
        >
        <span class="text-sm font-medium">{worker.sdkVersion}</span>
      </div>
    </div>

    <Card>
      <h3 class="mb-2 text-base font-semibold">
        {translate('workers.deployment-config')}
      </h3>
      <p class="mb-4 text-sm text-secondary">
        {translate('workers.deployment-config-description')}
      </p>

      <div class="flex flex-col gap-4">
        <h4 class="text-sm font-semibold">
          {translate('workers.compute-provider-section')}
        </h4>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary">
            {translate('workers.lambda-arn')}
          </span>
          <div class="flex items-center gap-2">
            <span class="break-all font-mono text-sm text-primary">
              {worker.lambdaArn}
            </span>
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
            {translate('workers.open-aws-lambda')}
          </Link>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary">
            {translate('workers.iam-role-arn')}
          </span>
          <div class="flex items-center gap-2">
            <span class="break-all font-mono text-sm text-primary">
              {worker.iamRoleArn}
            </span>
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
            {translate('workers.open-aws-iam')}
          </Link>
        </div>
      </div>

      <div class="mt-6 border-t border-subtle pt-4">
        <h4 class="mb-4 text-sm font-semibold">
          {translate('workers.worker-scaling-limits')}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-secondary"
              >{translate('workers.max-workers')}</span
            >
            <span class="text-sm font-medium">{worker.maxWorkers}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-secondary"
              >{translate('workers.max-task-queue-rate')}</span
            >
            <span class="text-sm font-medium"
              >{worker.maxTaskQueueActivitiesPerSecond}/s</span
            >
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-secondary"
              >{translate('workers.max-concurrent-activities')}</span
            >
            <span class="text-sm font-medium"
              >{worker.maxConcurrentActivities}</span
            >
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-secondary"
              >{translate('workers.idle-timeout')}</span
            >
            <span class="text-sm font-medium">{worker.idleTimeoutSeconds}s</span
            >
          </div>
        </div>
      </div>
    </Card>
  </div>

  <DeleteWorkerModal
    open={showDeleteModal}
    workerName={worker.name}
    on:confirmModal={handleDelete}
    on:cancelModal={() => (showDeleteModal = false)}
  />
{/if}
