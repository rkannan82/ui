<script lang="ts">
  import { writable } from 'svelte/store';

  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';

  import DeleteWorkerModal from '$lib/components/workers/delete-worker-modal.svelte';
  import Alert from '$lib/holocene/alert.svelte';
  import Button from '$lib/holocene/button.svelte';
  import Combobox from '$lib/holocene/combobox/combobox.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import Input from '$lib/holocene/input/input.svelte';
  import RadioGroup from '$lib/holocene/radio-input/radio-group.svelte';
  import RadioInput from '$lib/holocene/radio-input/radio-input.svelte';
  import Tooltip from '$lib/holocene/tooltip.svelte';
  import { translate } from '$lib/i18n/translate';
  import {
    validateIamRole,
    validateLambdaArn,
    validateRegion,
    validateTaskQueue,
  } from '$lib/services/serverless-worker-service';
  import type { ServerlessWorker } from '$lib/types/serverless-workers';

  import { editSchema, regions, type ValidationState } from './shared';

  type Props = {
    namespace: string;
    worker: ServerlessWorker;
    onSubmit: (data: Record<string, unknown>) => void;
    onDelete: () => void;
    cancelHref: string;
    submitButtonText: string;
  };

  let {
    namespace: _namespace,
    worker,
    onSubmit,
    onDelete,
    cancelHref,
    submitButtonText,
  }: Props = $props();

  const initialData = $derived({
    name: worker.name,
    lambdaArn: worker.lambdaArn,
    iamRoleArn: worker.iamRoleArn,
    region: worker.region,
    taskQueue: worker.taskQueue,
    maxWorkers: worker.maxWorkers,
    maxConcurrentActivities: worker.maxConcurrentActivities,
    maxTaskQueueActivitiesPerSecond: worker.maxTaskQueueActivitiesPerSecond,
    idleTimeoutSeconds: worker.idleTimeoutSeconds,
  });

  const superform = superForm(initialData, {
    SPA: true,
    validators: zodClient(editSchema),
    resetForm: false,
    dataType: 'json',
    onUpdate: async ({ form }) => {
      if (!form.valid) return;
      onSubmit(form.data);
    },
  });

  const { form, errors, enhance, submitting } = superform;

  let lambdaValidation = $state<ValidationState>({ checking: false });
  let iamValidation = $state<ValidationState>({ checking: false });
  let regionValidation = $state<ValidationState>({ checking: false });
  let taskQueueValidation = $state<ValidationState>({ checking: false });

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

  const provider = writable<string>('lambda');

  let showDeleteModal = $state(false);
</script>

<div class="flex flex-col gap-6">
  <form class="flex w-full flex-col gap-6" use:enhance novalidate>
    <div class="flex flex-col gap-4">
      <h3 class="text-base font-semibold">
        {translate('workers.configuration-section')}
      </h3>
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
        <div class="flex items-center gap-1">
          <label for="taskQueue" class="text-sm font-medium">
            {translate('workers.task-queue-label')}
          </label>
          <Tooltip top text={translate('workers.task-queue-help')}>
            <Icon name="circle-question" class="h-4 w-4 text-secondary" />
          </Tooltip>
        </div>
        <Input
          bind:value={$form.taskQueue}
          id="taskQueue"
          name="taskQueue"
          labelHidden
          label={translate('workers.task-queue-label')}
          hintText={$errors.taskQueue?.[0] ||
            translate('workers.task-queue-hint')}
          error={!!$errors.taskQueue?.[0]}
          placeholder={translate('workers.task-queue-placeholder')}
          required
          onblur={checkTaskQueue}
        />
        {#if taskQueueValidation.checking}
          <div class="flex items-center gap-2 text-xs text-secondary">
            <Icon name="spinner" class="h-3 w-3 animate-spin" />
            <span>{translate('workers.validation-checking-queue')}</span>
          </div>
        {:else if taskQueueValidation.result}
          <Alert
            intent={taskQueueValidation.result.valid ? 'success' : 'info'}
            title={taskQueueValidation.result.message}
          />
        {/if}
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <h3 class="text-base font-semibold">
        {translate('workers.compute-section')}
      </h3>
      <RadioGroup
        name="provider"
        group={provider}
        description={translate('workers.compute-provider-description')}
      >
        <RadioInput
          value="lambda"
          id="provider-lambda"
          label={translate('workers.provider-lambda')}
          description={translate('workers.provider-lambda-description')}
        />
        <RadioInput
          value="other"
          id="provider-other"
          label={translate('workers.provider-coming-soon')}
          description={translate('workers.provider-coming-soon-description')}
          disabled
        />
      </RadioGroup>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <label for="lambdaArn" class="text-sm font-medium">
            {translate('workers.lambda-arn-label')}
          </label>
          <Tooltip top text={translate('workers.lambda-arn-help')}>
            <Icon name="circle-question" class="h-4 w-4 text-secondary" />
          </Tooltip>
        </div>
        <Input
          bind:value={$form.lambdaArn}
          id="lambdaArn"
          name="lambdaArn"
          labelHidden
          label={translate('workers.lambda-arn-label')}
          hintText={$errors.lambdaArn?.[0] ||
            translate('workers.lambda-arn-hint')}
          error={!!$errors.lambdaArn?.[0]}
          placeholder={translate('workers.lambda-arn-placeholder')}
          required
          onblur={checkLambdaArn}
        />
        {#if lambdaValidation.checking}
          <div class="flex items-center gap-2 text-xs text-secondary">
            <Icon name="spinner" class="h-3 w-3 animate-spin" />
            <span>{translate('workers.validation-checking-lambda')}</span>
          </div>
        {:else if lambdaValidation.result}
          <Alert
            intent={lambdaValidation.result.valid ? 'success' : 'error'}
            title={lambdaValidation.result.message}
          />
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <label for="iamRoleArn" class="text-sm font-medium">
            {translate('workers.iam-role-label')}
          </label>
          <Tooltip top text={translate('workers.iam-role-help')}>
            <Icon name="circle-question" class="h-4 w-4 text-secondary" />
          </Tooltip>
        </div>
        <Input
          bind:value={$form.iamRoleArn}
          id="iamRoleArn"
          name="iamRoleArn"
          labelHidden
          label={translate('workers.iam-role-label')}
          hintText={$errors.iamRoleArn?.[0] ||
            translate('workers.iam-role-hint')}
          error={!!$errors.iamRoleArn?.[0]}
          placeholder={translate('workers.iam-role-placeholder')}
          required
          onblur={checkIamRole}
        />
        {#if iamValidation.checking}
          <div class="flex items-center gap-2 text-xs text-secondary">
            <Icon name="spinner" class="h-3 w-3 animate-spin" />
            <span>{translate('workers.validation-checking-iam')}</span>
          </div>
        {:else if iamValidation.result}
          <Alert
            intent={iamValidation.result.valid ? 'success' : 'error'}
            title={iamValidation.result.message}
          />
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <label for="region" class="text-sm font-medium">
            {translate('workers.region-label')}
          </label>
          <Tooltip top text={translate('workers.region-help')}>
            <Icon name="circle-question" class="h-4 w-4 text-secondary" />
          </Tooltip>
        </div>
        <Combobox
          id="region"
          label={translate('workers.region-label')}
          labelHidden
          placeholder="Search regions..."
          noResultsText="No matching regions"
          options={regions}
          optionValueKey="value"
          optionLabelKey="label"
          bind:value={$form.region}
          onchange={checkRegion}
          required
          error={$errors.region?.[0]}
        />
        {#if regionValidation.checking}
          <div class="flex items-center gap-2 text-xs text-secondary">
            <Icon name="spinner" class="h-3 w-3 animate-spin" />
            <span>{translate('workers.validation-checking-region')}</span>
          </div>
        {:else if regionValidation.result}
          <Alert
            intent={regionValidation.result.valid ? 'success' : 'warning'}
            title={regionValidation.result.message}
          />
        {/if}
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <h3 class="text-base font-semibold">
        {translate('workers.scaling-section')}
      </h3>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          value={String($form.maxWorkers)}
          oninput={(e) =>
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
          oninput={(e) =>
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
          oninput={(e) =>
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
          oninput={(e) =>
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
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex gap-4">
        <Button type="submit" loading={$submitting}>
          {submitButtonText}
        </Button>
        <Button variant="ghost" href={cancelHref}>
          {translate('common.cancel')}
        </Button>
      </div>
      <Button variant="destructive" on:click={() => (showDeleteModal = true)}>
        {translate('workers.delete-serverless-worker')}
      </Button>
    </div>
  </form>
</div>

<DeleteWorkerModal
  open={showDeleteModal}
  workerName={worker.name}
  on:confirmModal={onDelete}
  on:cancelModal={() => (showDeleteModal = false)}
/>
