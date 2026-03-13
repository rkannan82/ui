import type { WorkerInfo } from '$lib/types';
import type { DeploymentStatus } from '$lib/types/deployments';

export type ServerlessWorkerStatus = 'running' | 'stopped' | 'draining';

export type ServerlessWorker = {
  id: string;
  name: string;
  status: ServerlessWorkerStatus;
  compute: string;
  lambdaArn: string;
  iamRoleArn: string;
  region: string;
  taskQueue: string;
  maxWorkers: number;
  maxConcurrentActivities: number;
  maxTaskQueueActivitiesPerSecond: number;
  idleTimeoutSeconds: number;
  lastHeartbeat: string;
  sdkVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type ServerlessWorkerCreateInput = Omit<
  ServerlessWorker,
  'id' | 'status' | 'lastHeartbeat' | 'createdAt' | 'updatedAt'
>;

export type ServerlessWorkerUpdateInput = Pick<
  ServerlessWorker,
  | 'name'
  | 'lambdaArn'
  | 'iamRoleArn'
  | 'region'
  | 'taskQueue'
  | 'maxWorkers'
  | 'maxConcurrentActivities'
  | 'maxTaskQueueActivitiesPerSecond'
  | 'idleTimeoutSeconds'
>;

export type ServerlessWorkerMetricsCard = {
  slotType: string;
  slotsUsed: number;
  slotsAvailable: number;
  tasksProcessed: number;
  pollerCount: number;
  pollerStrategy: string;
  lastPoll: string;
};

export type ServerlessWorkerMetrics = {
  workflow: ServerlessWorkerMetricsCard;
  activity: ServerlessWorkerMetricsCard;
  nexus: ServerlessWorkerMetricsCard;
  localActivities: ServerlessWorkerMetricsCard;
};

export type ServerlessWorkerHostInfo = {
  region: string;
  hostName: string;
  processId: string;
  instanceKey: string;
  workerGroupingKey: string;
  cpuUsage: number;
  memoryUsage: number;
};

export type ServerlessWorkerCache = {
  cacheSize: number;
  cacheHitsPercent: number;
  activeThreadCount: number;
};

export type ServerlessWorkerDiagnostics = {
  pollSuccessRatePercent: number;
  rateLimit: number;
};

export type ServerlessWorkerVersion = {
  status: DeploymentStatus;
  name: string;
  buildId: string;
  deployedAt: string;
  rampingPercentage?: number;
};

export type ServerlessWorkerDetail = ServerlessWorker & {
  metrics: ServerlessWorkerMetrics;
  hostInfo: ServerlessWorkerHostInfo;
  cache: ServerlessWorkerCache;
  diagnostics: ServerlessWorkerDiagnostics;
  versions: ServerlessWorkerVersion[];
};

export type MockValidationResult = {
  valid: boolean;
  message: string;
};

export type UnifiedWorkerRow =
  | { type: 'traditional'; data: WorkerInfo }
  | { type: 'serverless'; data: ServerlessWorker };
