<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { z } from 'zod/v3';

  import { goto } from '$app/navigation';

  import Alert from '$lib/holocene/alert.svelte';
  import Button from '$lib/holocene/button.svelte';
  import Card from '$lib/holocene/card.svelte';
  import Input from '$lib/holocene/input/input.svelte';
  import { translate } from '$lib/i18n/translate';
  import {
    getServerlessWorker,
    updateServerlessWorker,
  } from '$lib/services/serverless-worker-service';
  import { routeForServerlessWorker } from '$lib/utilities/route-for';

  type Props = { id: string; namespace: string };
  let { id, namespace }: Props = $props();

  const worker = $derived(getServerlessWorker(id));
  const detailHref = $derived(routeForServerlessWorker({ namespace, id }));

  const schema = z.object({
    maxWorkers: z.number().min(1).max(100),
    maxConcurrentActivities: z.number().min(1).max(50),
    maxTaskQueueActivitiesPerSecond: z.number().min(1).max(10000),
    idleTimeoutSeconds: z.number().min(30).max(3600),
  });

  const initialData = $derived(
    worker
      ? {
          maxWorkers: worker.maxWorkers,
          maxConcurrentActivities: worker.maxConcurrentActivities,
          maxTaskQueueActivitiesPerSecond:
            worker.maxTaskQueueActivitiesPerSecond,
          idleTimeoutSeconds: worker.idleTimeoutSeconds,
        }
      : {
          maxWorkers: 10,
          maxConcurrentActivities: 5,
          maxTaskQueueActivitiesPerSecond: 100,
          idleTimeoutSeconds: 300,
        },
  );

  const superform = superForm(initialData, {
    SPA: true,
    validators: zodClient(schema),
    resetForm: false,
    dataType: 'json',
    onUpdate: async ({ form }) => {
      if (!form.valid) return;
      updateServerlessWorker(id, form.data);
      goto(detailHref);
    },
  });

  const { form, errors, enhance, submitting } = superform;
</script>

{#if !worker}
  <Alert intent="warning" title="Serverless worker not found">
    No serverless worker found with ID "{id}".
  </Alert>
{:else}
  <div class="flex flex-col gap-6">
    <Card>
      <h3 class="mb-4 text-base font-semibold">
        {translate('workers.connection-details')}
      </h3>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary"
            >{translate('workers.name-label')}</span
          >
          <span class="text-sm text-primary">{worker.name}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary"
            >{translate('workers.region')}</span
          >
          <span class="text-sm text-primary">{worker.region}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary"
            >{translate('workers.lambda-arn')}</span
          >
          <span class="break-all font-mono text-sm text-primary"
            >{worker.lambdaArn}</span
          >
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary"
            >{translate('workers.iam-role-arn')}</span
          >
          <span class="break-all font-mono text-sm text-primary"
            >{worker.iamRoleArn}</span
          >
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary"
            >{translate('workers.task-queue')}</span
          >
          <span class="text-sm text-primary">{worker.taskQueue}</span>
        </div>
      </div>
    </Card>

    <form class="flex w-full flex-col gap-4 xl:w-2/3" use:enhance novalidate>
      <h3 class="text-base font-semibold">
        {translate('workers.advanced-config')}
      </h3>
      <Input
        value={String($form.maxWorkers)}
        on:input={(e) =>
          ($form.maxWorkers = Number(
            (e.currentTarget as HTMLInputElement).value,
          ))}
        id="maxWorkers"
        name="maxWorkers"
        label={translate('workers.max-workers-label')}
        hintText={$errors.maxWorkers?.[0] ||
          translate('workers.max-workers-hint')}
        error={!!$errors.maxWorkers?.[0]}
      />
      <Input
        value={String($form.maxConcurrentActivities)}
        on:input={(e) =>
          ($form.maxConcurrentActivities = Number(
            (e.currentTarget as HTMLInputElement).value,
          ))}
        id="maxConcurrentActivities"
        name="maxConcurrentActivities"
        label={translate('workers.max-concurrent-label')}
        hintText={$errors.maxConcurrentActivities?.[0] ||
          translate('workers.max-concurrent-hint')}
        error={!!$errors.maxConcurrentActivities?.[0]}
      />
      <Input
        value={String($form.maxTaskQueueActivitiesPerSecond)}
        on:input={(e) =>
          ($form.maxTaskQueueActivitiesPerSecond = Number(
            (e.currentTarget as HTMLInputElement).value,
          ))}
        id="maxRate"
        name="maxRate"
        label={translate('workers.max-rate-label')}
        hintText={$errors.maxTaskQueueActivitiesPerSecond?.[0] ||
          translate('workers.max-rate-hint')}
        error={!!$errors.maxTaskQueueActivitiesPerSecond?.[0]}
      />
      <Input
        value={String($form.idleTimeoutSeconds)}
        on:input={(e) =>
          ($form.idleTimeoutSeconds = Number(
            (e.currentTarget as HTMLInputElement).value,
          ))}
        id="idleTimeout"
        name="idleTimeout"
        label={translate('workers.idle-timeout-label')}
        hintText={$errors.idleTimeoutSeconds?.[0] ||
          translate('workers.idle-timeout-hint')}
        error={!!$errors.idleTimeoutSeconds?.[0]}
      />

      <div class="flex gap-4">
        <Button type="submit" loading={$submitting}>
          {translate('workers.save-changes')}
        </Button>
        <Button variant="ghost" on:click={() => goto(detailHref)}>
          {translate('common.cancel')}
        </Button>
      </div>
    </form>
  </div>
{/if}
