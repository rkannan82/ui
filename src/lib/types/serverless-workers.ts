import type { WorkerInfo } from '$lib/types';

export type ServerlessWorkerStatus =
  | 'active'
  | 'degraded'
  | 'inactive'
  | 'provisioning';

export type ServerlessWorker = {
  id: string;
  name: string;
  status: ServerlessWorkerStatus;
  lambdaArn: string;
  iamRoleArn: string;
  region: string;
  taskQueue: string;
  maxWorkers: number;
  maxConcurrentActivities: number;
  maxTaskQueueActivitiesPerSecond: number;
  idleTimeoutSeconds: number;
  createdAt: string;
  updatedAt: string;
};

export type ServerlessWorkerCreateInput = Omit<
  ServerlessWorker,
  'id' | 'status' | 'createdAt' | 'updatedAt'
>;

export type ServerlessWorkerUpdateInput = Pick<
  ServerlessWorker,
  | 'maxWorkers'
  | 'maxConcurrentActivities'
  | 'maxTaskQueueActivitiesPerSecond'
  | 'idleTimeoutSeconds'
>;

export type MockValidationResult = {
  valid: boolean;
  message: string;
};

export type UnifiedWorkerRow =
  | { type: 'traditional'; data: WorkerInfo }
  | { type: 'serverless'; data: ServerlessWorker };
