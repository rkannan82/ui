<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { z } from 'zod/v3';

  import Accordion from '$lib/holocene/accordion/accordion.svelte';
  import Alert from '$lib/holocene/alert.svelte';
  import Button from '$lib/holocene/button.svelte';
  import Input from '$lib/holocene/input/input.svelte';
  import { translate } from '$lib/i18n/translate';
  import {
    createServerlessWorker,
    validateIamRole,
    validateLambdaArn,
    validateRegion,
    validateTaskQueue,
  } from '$lib/services/serverless-worker-service';
  import type { MockValidationResult } from '$lib/types/serverless-workers';

  type Props = {
    namespace: string;
    onSuccess: () => void;
  };

  let { namespace: _namespace, onSuccess }: Props = $props();

  const schema = z.object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters')
      .max(100)
      .regex(
        /^[a-z][a-z0-9-]*$/,
        'Must be lowercase, alphanumeric with hyphens',
      ),
    lambdaArn: z
      .string()
      .min(1, 'Lambda ARN is required')
      .regex(
        /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:.+$/,
        'Invalid Lambda ARN format',
      ),
    iamRoleArn: z
      .string()
      .min(1, 'IAM Role ARN is required')
      .regex(/^arn:aws:iam::\d{12}:role\/.+$/, 'Invalid IAM Role ARN format'),
    region: z.string().min(1, 'Region is required'),
    taskQueue: z.string().min(1, 'Task queue is required'),
    maxWorkers: z.number().min(1).max(100).default(10),
    maxConcurrentActivities: z.number().min(1).max(50).default(5),
    maxTaskQueueActivitiesPerSecond: z.number().min(1).max(10000).default(100),
    idleTimeoutSeconds: z.number().min(30).max(3600).default(300),
  });

  const initialData = {
    name: '',
    lambdaArn: '',
    iamRoleArn: '',
    region: '',
    taskQueue: '',
    maxWorkers: 10,
    maxConcurrentActivities: 5,
    maxTaskQueueActivitiesPerSecond: 100,
    idleTimeoutSeconds: 300,
  };

  const superform = superForm(initialData, {
    SPA: true,
    validators: zodClient(schema),
    resetForm: false,
    dataType: 'json',
    onUpdate: async ({ form }) => {
      if (!form.valid) return;
      createServerlessWorker({
        name: form.data.name,
        lambdaArn: form.data.lambdaArn,
        iamRoleArn: form.data.iamRoleArn,
        region: form.data.region,
        taskQueue: form.data.taskQueue,
        maxWorkers: form.data.maxWorkers,
        maxConcurrentActivities: form.data.maxConcurrentActivities,
        maxTaskQueueActivitiesPerSecond:
          form.data.maxTaskQueueActivitiesPerSecond,
        idleTimeoutSeconds: form.data.idleTimeoutSeconds,
      });
      onSuccess();
    },
  });

  const { form, errors, enhance, submitting } = superform;

  let lambdaValidation = $state<{
    checking: boolean;
    result?: MockValidationResult;
  }>({ checking: false });
  let iamValidation = $state<{
    checking: boolean;
    result?: MockValidationResult;
  }>({ checking: false });
  let regionValidation = $state<{
    checking: boolean;
    result?: MockValidationResult;
  }>({ checking: false });
  let taskQueueValidation = $state<{
    checking: boolean;
    result?: MockValidationResult;
  }>({ checking: false });

  async function checkLambdaArn() {
    const arn = $form.lambdaArn;
    if (!arn || !/^arn:aws:lambda:/.test(arn)) return;
    lambdaValidation = { checking: true };
    const result = await validateLambdaArn(arn);
    lambdaValidation = { checking: false, result };
  }

  async function checkIamRole() {
    const arn = $form.iamRoleArn;
    if (!arn || !/^arn:aws:iam::/.test(arn)) return;
    iamValidation = { checking: true };
    const result = await validateIamRole(arn);
    iamValidation = { checking: false, result };
  }

  async function checkRegion() {
    const region = $form.region;
    if (!region) return;
    regionValidation = { checking: true };
    const result = await validateRegion(region);
    regionValidation = { checking: false, result };
  }

  async function checkTaskQueue() {
    const name = $form.taskQueue;
    if (!name) return;
    taskQueueValidation = { checking: true };
    const result = await validateTaskQueue(name);
    taskQueueValidation = { checking: false, result };
  }

  const regions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU (Ireland)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  ];
</script>

<form class="flex w-full flex-col gap-4 xl:w-2/3" use:enhance novalidate>
  <Input
    bind:value={$form.name}
    id="name"
    name="name"
    label={translate('workers.name-label')}
    hintText={$errors.name?.[0] || translate('workers.name-hint')}
    error={!!$errors.name?.[0]}
    placeholder={translate('workers.name-placeholder')}
    required
  />

  <div class="flex flex-col gap-1">
    <Input
      bind:value={$form.lambdaArn}
      id="lambdaArn"
      name="lambdaArn"
      label={translate('workers.lambda-arn-label')}
      hintText={$errors.lambdaArn?.[0] || translate('workers.lambda-arn-hint')}
      error={!!$errors.lambdaArn?.[0]}
      placeholder={translate('workers.lambda-arn-placeholder')}
      required
      on:blur={checkLambdaArn}
    />
    {#if lambdaValidation.checking}
      <span class="text-xs text-secondary"
        >{translate('workers.validation-checking')}</span
      >
    {:else if lambdaValidation.result}
      <Alert
        intent={lambdaValidation.result.valid ? 'success' : 'error'}
        title={lambdaValidation.result.message}
      />
    {/if}
  </div>

  <div class="flex flex-col gap-1">
    <Input
      bind:value={$form.iamRoleArn}
      id="iamRoleArn"
      name="iamRoleArn"
      label={translate('workers.iam-role-label')}
      hintText={$errors.iamRoleArn?.[0] || translate('workers.iam-role-hint')}
      error={!!$errors.iamRoleArn?.[0]}
      placeholder={translate('workers.iam-role-placeholder')}
      required
      on:blur={checkIamRole}
    />
    {#if iamValidation.checking}
      <span class="text-xs text-secondary"
        >{translate('workers.validation-checking')}</span
      >
    {:else if iamValidation.result}
      <Alert
        intent={iamValidation.result.valid ? 'success' : 'error'}
        title={iamValidation.result.message}
      />
    {/if}
  </div>

  <div class="flex flex-col gap-1">
    <label for="region" class="text-sm font-medium text-primary">
      {translate('workers.region-label')}
    </label>
    <select
      id="region"
      name="region"
      bind:value={$form.region}
      onblur={checkRegion}
      class="surface-primary border border-subtle px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/70"
    >
      <option value="" disabled>Select a region</option>
      {#each regions as { value, label } (value)}
        <option {value}>{label}</option>
      {/each}
    </select>
    <span class="text-xs text-secondary"
      >{$errors.region?.[0] || translate('workers.region-hint')}</span
    >
    {#if regionValidation.checking}
      <span class="text-xs text-secondary"
        >{translate('workers.validation-checking')}</span
      >
    {:else if regionValidation.result}
      <Alert
        intent={regionValidation.result.valid ? 'success' : 'warning'}
        title={regionValidation.result.message}
      />
    {/if}
  </div>

  <div class="flex flex-col gap-1">
    <Input
      bind:value={$form.taskQueue}
      id="taskQueue"
      name="taskQueue"
      label={translate('workers.task-queue-label')}
      hintText={$errors.taskQueue?.[0] || translate('workers.task-queue-hint')}
      error={!!$errors.taskQueue?.[0]}
      placeholder={translate('workers.task-queue-placeholder')}
      required
      on:blur={checkTaskQueue}
    />
    {#if taskQueueValidation.checking}
      <span class="text-xs text-secondary"
        >{translate('workers.validation-checking')}</span
      >
    {:else if taskQueueValidation.result}
      <Alert
        intent={taskQueueValidation.result.valid ? 'success' : 'error'}
        title={taskQueueValidation.result.message}
      />
    {/if}
  </div>

  <Accordion title={translate('workers.advanced-config')} id="advanced-config">
    <div class="flex flex-col gap-4 p-4">
      <Input
        value={String($form.maxWorkers)}
        on:input={(e) =>
          ($form.maxWorkers = Number(
            (e.currentTarget as HTMLInputElement).value,
          ))}
        id="maxWorkers"
        name="maxWorkers"
        label={translate('workers.max-workers-label')}
        hintText={translate('workers.max-workers-hint')}
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
        hintText={translate('workers.max-concurrent-hint')}
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
        hintText={translate('workers.max-rate-hint')}
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
        hintText={translate('workers.idle-timeout-hint')}
      />
    </div>
  </Accordion>

  <div class="flex gap-4">
    <Button type="submit" loading={$submitting}>
      {translate('workers.create-serverless-worker')}
    </Button>
    <Button variant="ghost" on:click={onSuccess}>
      {translate('common.cancel')}
    </Button>
  </div>
</form>
