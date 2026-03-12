<script lang="ts">
  import { writable } from 'svelte/store';

  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { z } from 'zod/v3';

  import Accordion from '$lib/holocene/accordion/accordion.svelte';
  import Alert from '$lib/holocene/alert.svelte';
  import Button from '$lib/holocene/button.svelte';
  import Card from '$lib/holocene/card.svelte';
  import CodeBlock from '$lib/holocene/code-block.svelte';
  import Combobox from '$lib/holocene/combobox/combobox.svelte';
  import Icon from '$lib/holocene/icon/icon.svelte';
  import Input from '$lib/holocene/input/input.svelte';
  import Link from '$lib/holocene/link.svelte';
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
  import type { MockValidationResult } from '$lib/types/serverless-workers';
  import type { ServerlessWorker } from '$lib/types/serverless-workers';

  type Props = {
    namespace: string;
    onSubmit: (data: Record<string, unknown>) => void;
    worker?: ServerlessWorker;
    submitButtonText: string;
    cancelHref: string;
  };

  let {
    namespace: _namespace,
    onSubmit,
    worker,
    submitButtonText,
    cancelHref,
  }: Props = $props();

  const isEditMode = $derived(!!worker);

  const createSchema = z.object({
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

  const editSchema = z.object({
    maxWorkers: z.number().min(1).max(100),
    maxConcurrentActivities: z.number().min(1).max(50),
    maxTaskQueueActivitiesPerSecond: z.number().min(1).max(10000),
    idleTimeoutSeconds: z.number().min(30).max(3600),
  });

  const initialData = $derived(
    isEditMode
      ? {
          maxWorkers: worker!.maxWorkers,
          maxConcurrentActivities: worker!.maxConcurrentActivities,
          maxTaskQueueActivitiesPerSecond:
            worker!.maxTaskQueueActivitiesPerSecond,
          idleTimeoutSeconds: worker!.idleTimeoutSeconds,
        }
      : {
          name: '',
          lambdaArn: '',
          iamRoleArn: '',
          region: '',
          taskQueue: '',
          maxWorkers: 10,
          maxConcurrentActivities: 5,
          maxTaskQueueActivitiesPerSecond: 100,
          idleTimeoutSeconds: 300,
        },
  );

  const superform = superForm(initialData, {
    SPA: true,
    validators: zodClient(isEditMode ? editSchema : createSchema),
    resetForm: false,
    dataType: 'json',
    onUpdate: async ({ form }) => {
      if (!form.valid) return;
      onSubmit(form.data);
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
    { value: 'us-east-1', label: 'US East (N. Virginia) — us-east-1' },
    { value: 'us-west-2', label: 'US West (Oregon) — us-west-2' },
    { value: 'eu-west-1', label: 'EU (Ireland) — eu-west-1' },
    {
      value: 'ap-southeast-1',
      label: 'Asia Pacific (Singapore) — ap-southeast-1',
    },
  ];

  const provider = writable<string>('lambda');

  let activeTab = $state('CloudFormation');

  const cfnSnippet = `AWSTemplateFormatVersion: '2010-09-09'
Resources:
  TemporalWorkerRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: temporal.io
            Action: sts:AssumeRole
      Policies:
        - PolicyName: InvokeLambda
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: lambda:InvokeFunction
                Resource: '*'`;

  const terraformSnippet = `resource "aws_iam_role" "temporal_worker" {
  name = "temporal-serverless-worker"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "temporal.io" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "invoke_lambda" {
  name = "invoke-lambda"
  role = aws_iam_role.temporal_worker.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = "*"
    }]
  })
}`;

  const snippetContent = $derived(
    activeTab === 'CloudFormation' ? cfnSnippet : terraformSnippet,
  );
  const snippetLanguage = 'text' as const;
</script>

{#if isEditMode}
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
          <span class="text-sm text-primary">{worker!.name}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary"
            >{translate('workers.region')}</span
          >
          <span class="text-sm text-primary">{worker!.region}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary"
            >{translate('workers.lambda-arn')}</span
          >
          <span class="break-all font-mono text-sm text-primary"
            >{worker!.lambdaArn}</span
          >
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary"
            >{translate('workers.iam-role-arn')}</span
          >
          <span class="break-all font-mono text-sm text-primary"
            >{worker!.iamRoleArn}</span
          >
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-secondary"
            >{translate('workers.task-queue')}</span
          >
          <span class="text-sm text-primary">{worker!.taskQueue}</span>
        </div>
      </div>
    </Card>

    <form class="flex w-full flex-col gap-4 xl:w-1/2" use:enhance novalidate>
      <h3 class="text-base font-semibold">
        {translate('workers.advanced-config')}
      </h3>
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

      <div class="flex gap-4">
        <Button type="submit" loading={$submitting}>
          {submitButtonText}
        </Button>
        <Button variant="ghost" href={cancelHref}>
          {translate('common.cancel')}
        </Button>
      </div>
    </form>
  </div>
{:else}
  <div class="flex w-full flex-col gap-6 xl:w-1/2">
    <div class="mb-4">
      <h3 class="mb-2 text-base font-semibold">
        {translate('workers.compute-provider')}
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
    </div>

    <Accordion
      title={translate('workers.setup-guide-title')}
      id="setup-guide"
      open
    >
      <div class="flex flex-col gap-4 p-4">
        <p class="text-sm text-secondary">
          {translate('workers.setup-guide-intro')}
        </p>
        <div class="flex gap-4">
          <Link href="https://console.aws.amazon.com/lambda" newTab>
            {translate('workers.setup-guide-lambda-console')}
          </Link>
          <Link href="https://console.aws.amazon.com/iam" newTab>
            {translate('workers.setup-guide-iam-console')}
          </Link>
        </div>
        <p class="text-sm text-secondary">
          {translate('workers.setup-guide-iam-note')}
        </p>
        <CodeBlock
          tabs={['CloudFormation', 'Terraform']}
          bind:activeTab
          content={snippetContent}
          language={snippetLanguage}
          copyable
          copyIconTitle="Copy snippet"
          copySuccessIconTitle="Copied!"
        />
      </div>
    </Accordion>

    <form class="flex w-full flex-col gap-4" use:enhance novalidate>
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

      <Accordion
        title={translate('workers.advanced-config')}
        id="advanced-config"
      >
        <div class="flex flex-col gap-4 p-4">
          <Input
            value={String($form.maxWorkers)}
            oninput={(e) =>
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
            oninput={(e) =>
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
            oninput={(e) =>
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
            oninput={(e) =>
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
          {submitButtonText}
        </Button>
        <Button variant="ghost" href={cancelHref}>
          {translate('common.cancel')}
        </Button>
      </div>
    </form>
  </div>
{/if}
