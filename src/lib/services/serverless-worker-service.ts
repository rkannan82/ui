import type {
  MockValidationResult,
  ServerlessWorker,
  ServerlessWorkerCreateInput,
  ServerlessWorkerUpdateInput,
} from '$lib/types/serverless-workers';

const MOCK_TASK_QUEUES = [
  'order-processing',
  'payment-tasks',
  'notification-queue',
  'etl-pipeline',
];

let mockWorkers: ServerlessWorker[] = [
  {
    id: 'slw-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'order-processor',
    status: 'active',
    lambdaArn:
      'arn:aws:lambda:us-east-1:123456789012:function:temporal-order-processor',
    iamRoleArn:
      'arn:aws:iam::123456789012:role/temporal-order-processor-execution-role',
    region: 'us-east-1',
    taskQueue: 'order-processing',
    maxWorkers: 10,
    maxConcurrentActivities: 100,
    maxTaskQueueActivitiesPerSecond: 50,
    idleTimeoutSeconds: 300,
    createdAt: '2024-11-01T09:00:00Z',
    updatedAt: '2024-11-15T14:22:00Z',
  },
  {
    id: 'slw-b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'payment-handler',
    status: 'active',
    lambdaArn:
      'arn:aws:lambda:us-west-2:123456789012:function:temporal-payment-handler',
    iamRoleArn:
      'arn:aws:iam::123456789012:role/temporal-payment-handler-execution-role',
    region: 'us-west-2',
    taskQueue: 'payment-tasks',
    maxWorkers: 5,
    maxConcurrentActivities: 50,
    maxTaskQueueActivitiesPerSecond: 25,
    idleTimeoutSeconds: 120,
    createdAt: '2024-10-15T11:30:00Z',
    updatedAt: '2024-11-20T08:45:00Z',
  },
  {
    id: 'slw-c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'notification-sender',
    status: 'degraded',
    lambdaArn:
      'arn:aws:lambda:eu-west-1:123456789012:function:temporal-notification-sender',
    iamRoleArn:
      'arn:aws:iam::123456789012:role/temporal-notification-sender-execution-role',
    region: 'eu-west-1',
    taskQueue: 'notification-queue',
    maxWorkers: 20,
    maxConcurrentActivities: 200,
    maxTaskQueueActivitiesPerSecond: 100,
    idleTimeoutSeconds: 600,
    createdAt: '2024-09-20T16:00:00Z',
    updatedAt: '2024-11-22T03:12:00Z',
  },
  {
    id: 'slw-d4e5f6a7-b8c9-0123-defa-234567890123',
    name: 'data-pipeline',
    status: 'provisioning',
    lambdaArn:
      'arn:aws:lambda:ap-southeast-1:123456789012:function:temporal-data-pipeline',
    iamRoleArn:
      'arn:aws:iam::123456789012:role/temporal-data-pipeline-execution-role',
    region: 'ap-southeast-1',
    taskQueue: 'etl-pipeline',
    maxWorkers: 8,
    maxConcurrentActivities: 80,
    maxTaskQueueActivitiesPerSecond: 40,
    idleTimeoutSeconds: 900,
    createdAt: '2024-11-25T10:00:00Z',
    updatedAt: '2024-11-25T10:00:00Z',
  },
];

const MOCK_LAMBDA_ARNS = mockWorkers.map((w) => w.lambdaArn);
const MOCK_IAM_ROLE_ARNS = mockWorkers.map((w) => w.iamRoleArn);

export function getServerlessWorkers(): ServerlessWorker[] {
  return mockWorkers;
}

export function getServerlessWorker(id: string): ServerlessWorker | undefined {
  return mockWorkers.find((w) => w.id === id);
}

export function createServerlessWorker(
  input: ServerlessWorkerCreateInput,
): ServerlessWorker {
  const now = new Date().toISOString();
  const worker: ServerlessWorker = {
    ...input,
    id: crypto.randomUUID(),
    status: 'provisioning',
    createdAt: now,
    updatedAt: now,
  };
  mockWorkers = [...mockWorkers, worker];
  return worker;
}

export function deleteServerlessWorker(id: string): boolean {
  const index = mockWorkers.findIndex((w) => w.id === id);
  if (index === -1) return false;
  mockWorkers = mockWorkers.filter((w) => w.id !== id);
  return true;
}

export function updateServerlessWorker(
  id: string,
  input: ServerlessWorkerUpdateInput,
): ServerlessWorker | undefined {
  const index = mockWorkers.findIndex((w) => w.id === id);
  if (index === -1) return undefined;
  const updated = {
    ...mockWorkers[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  mockWorkers = mockWorkers.map((w) => (w.id === id ? updated : w));
  return updated;
}

export async function validateLambdaArn(
  arn: string,
): Promise<MockValidationResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!arn.startsWith('arn:aws:lambda:')) {
    return { valid: false, message: 'Invalid Lambda ARN format' };
  }
  if (MOCK_LAMBDA_ARNS.includes(arn)) {
    return { valid: true, message: 'Lambda function verified' };
  }
  return {
    valid: false,
    message:
      'Lambda function not found. Verify the ARN and ensure the function exists in the specified region.',
  };
}

export async function validateIamRole(
  arn: string,
): Promise<MockValidationResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!arn.startsWith('arn:aws:iam::')) {
    return { valid: false, message: 'Invalid IAM role ARN format' };
  }
  if (MOCK_IAM_ROLE_ARNS.includes(arn)) {
    return { valid: true, message: 'Permissions verified' };
  }
  return {
    valid: false,
    message:
      'IAM role lacks required permissions. Ensure the role has a trust policy allowing Temporal to assume it.',
  };
}

export async function validateRegion(
  region: string,
  namespaceRegion: string = 'us-west-2',
): Promise<MockValidationResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (region === namespaceRegion) {
    return { valid: true, message: 'Region matches namespace region' };
  }
  return {
    valid: true,
    message: `Cross-region latency warning: worker in ${region}, namespace in ${namespaceRegion}`,
  };
}

export async function validateTaskQueue(
  name: string,
): Promise<MockValidationResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (MOCK_TASK_QUEUES.includes(name)) {
    return { valid: true, message: 'Task queue found' };
  }
  return {
    valid: true,
    message:
      'This will create a new task queue. Serverless workers require a dedicated task queue.',
  };
}
