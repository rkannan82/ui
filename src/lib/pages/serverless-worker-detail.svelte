<script lang="ts">
  import DeploymentStatus from '$lib/components/deployments/deployment-status.svelte';
  import Timestamp from '$lib/components/timestamp.svelte';
  import ServerlessWorkerDetailSkeleton from '$lib/components/workers/serverless-worker-detail-skeleton.svelte';
  import ServerlessWorkerStatus from '$lib/components/workers/serverless-worker-status.svelte';
  import Alert from '$lib/holocene/alert.svelte';
  import Badge from '$lib/holocene/badge.svelte';
  import Button from '$lib/holocene/button.svelte';
  import Card from '$lib/holocene/card.svelte';
  import CopyButton from '$lib/holocene/copyable/button.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import Link from '$lib/holocene/link.svelte';
  import TabList from '$lib/holocene/tab/tab-list.svelte';
  import TabPanel from '$lib/holocene/tab/tab-panel.svelte';
  import Tab from '$lib/holocene/tab/tab.svelte';
  import Tabs from '$lib/holocene/tab/tabs.svelte';
  import { translate } from '$lib/i18n/translate';
  import {
    getServerlessWorker,
    getServerlessWorkerDetail,
  } from '$lib/services/serverless-worker-service';
  import type { ServerlessWorkerMetricsCard } from '$lib/types/serverless-workers';
  import { copyToClipboard } from '$lib/utilities/copy-to-clipboard';
  import {
    routeForServerlessWorkerEdit,
    routeForWorkers,
    routeForWorkflowsWithQuery,
  } from '$lib/utilities/route-for';

  type Props = { id: string; namespace: string; loading?: boolean };
  let { id, namespace, loading = false }: Props = $props();

  const worker = $derived(getServerlessWorker(id));
  const detail = $derived(getServerlessWorkerDetail(id));

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

    <Tabs>
      <TabList label={translate('workers.serverless-worker')}>
        <Tab
          id="metrics-tab"
          panelId="metrics-panel"
          label={translate('workers.metrics')}
        />
        <Tab
          id="versions-tab"
          panelId="versions-panel"
          label={translate('workers.versions')}
        />
      </TabList>
      <TabPanel id="metrics-panel" tabId="metrics-tab">
        {#if detail}
          <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div class="col-span-1 flex flex-col gap-4 xl:col-span-2">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                {#each [{ title: translate('workers.workflow-tasks'), data: detail.metrics.workflow }, { title: translate('workers.activity-tasks'), data: detail.metrics.activity }, { title: translate('workers.nexus-tasks'), data: detail.metrics.nexus }, { title: translate('workers.local-activities'), data: detail.metrics.localActivities }] as { title, data } (title)}
                  {@const card = data as ServerlessWorkerMetricsCard}
                  <Card>
                    <h4 class="mb-3 text-sm font-semibold">{title}</h4>
                    <div class="flex flex-col gap-3">
                      <div class="flex flex-col gap-1">
                        <div
                          class="flex items-center justify-between text-xs text-secondary"
                        >
                          <span>{translate('workers.slots-used')}</span>
                          <span>{card.slotsUsed}/{card.slotsAvailable}</span>
                        </div>
                        <div class="h-2 w-full rounded-full bg-subtle">
                          <div
                            class="h-2 rounded-full bg-blue-500"
                            style="width: {(card.slotsUsed /
                              card.slotsAvailable) *
                              100}%"
                          ></div>
                        </div>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-secondary"
                          >{translate('workers.tasks-processed')}</span
                        >
                        <span class="text-sm font-medium"
                          >{card.tasksProcessed}</span
                        >
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-secondary"
                          >{translate('workers.poller-count')}</span
                        >
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium"
                            >{card.pollerCount}</span
                          >
                          <Badge type="primary">{card.pollerType}</Badge>
                        </div>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-secondary"
                          >{translate('workers.last-poll')}</span
                        >
                        <span class="text-sm"
                          ><Timestamp dateTime={card.lastPoll} /></span
                        >
                      </div>
                    </div>
                  </Card>
                {/each}
              </div>
            </div>

            <div class="col-span-1 flex flex-col gap-4">
              <Card>
                <h4 class="mb-3 text-sm font-semibold">
                  {translate('workers.host-info')}
                </h4>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.region')}</span
                    >
                    <span class="text-sm font-medium"
                      >{detail.hostInfo.region}</span
                    >
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.host-name')}</span
                    >
                    <span class="truncate text-sm font-medium"
                      >{detail.hostInfo.hostName}</span
                    >
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.process-id')}</span
                    >
                    <span class="text-sm font-medium"
                      >{detail.hostInfo.processId}</span
                    >
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.instance-key')}</span
                    >
                    <span class="text-sm font-medium"
                      >{detail.hostInfo.instanceKey}</span
                    >
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.worker-grouping-key')}</span
                    >
                    <span class="truncate text-sm font-medium"
                      >{detail.hostInfo.workerGroupingKey}</span
                    >
                  </div>
                  <div class="flex flex-col gap-1">
                    <div
                      class="flex items-center justify-between text-xs text-secondary"
                    >
                      <span>{translate('workers.cpu-usage')}</span>
                      <span>{detail.hostInfo.cpuUsage}%</span>
                    </div>
                    <div class="h-2 w-full rounded-full bg-subtle">
                      <div
                        class="h-2 rounded-full bg-green-500"
                        style="width: {detail.hostInfo.cpuUsage}%"
                      ></div>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <div
                      class="flex items-center justify-between text-xs text-secondary"
                    >
                      <span>{translate('workers.memory-usage')}</span>
                      <span>{detail.hostInfo.memoryUsage}%</span>
                    </div>
                    <div class="h-2 w-full rounded-full bg-subtle">
                      <div
                        class="h-2 rounded-full bg-purple-500"
                        style="width: {detail.hostInfo.memoryUsage}%"
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h4 class="mb-3 text-sm font-semibold">
                  {translate('workers.workflow-cache')}
                </h4>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.cache-size')}</span
                    >
                    <span class="text-sm font-medium"
                      >{detail.cache.cacheSize}</span
                    >
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.cache-hits')}</span
                    >
                    <span class="text-sm font-medium"
                      >{detail.cache.cacheHitsPercent}%</span
                    >
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.active-threads')}</span
                    >
                    <span class="text-sm font-medium"
                      >{detail.cache.activeThreadCount}</span
                    >
                  </div>
                </div>
              </Card>

              <Card>
                <h4 class="mb-3 text-sm font-semibold">
                  {translate('workers.diagnostics')}
                </h4>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.poll-success-rate')}</span
                    >
                    <span class="text-sm font-medium"
                      >{detail.diagnostics.pollSuccessRatePercent}%</span
                    >
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-secondary"
                      >{translate('workers.rate-limit')}</span
                    >
                    <span class="text-sm font-medium"
                      >{detail.diagnostics.rateLimit}/s</span
                    >
                  </div>
                </div>
              </Card>
            </div>
          </div>
        {/if}
      </TabPanel>
      <TabPanel id="versions-panel" tabId="versions-tab">
        {#if detail}
          <div class="mt-4">
            <table class="w-full">
              <thead>
                <tr
                  class="border-b border-subtle text-left text-xs text-secondary"
                >
                  <th class="pb-2">{translate('workers.status')}</th>
                  <th class="pb-2">{translate('workers.version-name')}</th>
                  <th class="pb-2">{translate('workers.buildId')}</th>
                  <th class="pb-2">{translate('workers.deployed-at')}</th>
                  <th class="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {#each detail.versions as version (version.name)}
                  <tr class="border-b border-subtle">
                    <td class="py-3">
                      <DeploymentStatus
                        status={version.status}
                        label={version.status === 'Ramping'
                          ? `Ramping ${version.rampingPercentage ?? 0}%`
                          : version.status}
                      />
                    </td>
                    <td class="py-3 text-sm">{version.name}</td>
                    <td class="py-3 font-mono text-sm">{version.buildId}</td>
                    <td class="py-3 text-sm">
                      <Timestamp dateTime={version.deployedAt} />
                    </td>
                    <td class="py-3">
                      <Link
                        href={routeForWorkflowsWithQuery({
                          namespace,
                          query: `TaskQueue="${worker.taskQueue}"`,
                        })}
                      >
                        {translate('workers.go-to-workflows')}
                      </Link>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </TabPanel>
    </Tabs>
  </div>
{/if}
