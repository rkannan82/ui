import type { PollerInfo } from '$lib/types';

export type InsightType =
  | 'NO_WORKERS'
  | 'WORKER_CRASHING'
  | 'WORKER_UNHEALTHY'
  | 'POLLER_SHORTAGE'
  | 'RATE_LIMITED'
  | 'SLOT_EXHAUSTION'
  | 'WORKFLOW_FAILURES'
  | 'WORKFLOW_TASK_FAILURES';

export type InsightSeverity = 'critical' | 'warning' | 'info';

export type Remediation = {
  label: string;
  description: string;
  action?: 'view-logs' | 'send-signal' | 'link';
  href?: string;
};

export type EventCorrelation = {
  event: {
    id: string;
    type: string;
    timestamp: string;
    namespace: string;
    resourceType: string;
    resourceId: string;
    title: string;
    details?: Record<string, string>;
  };
  timeDelta: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
};

export type TaskQueueInsight = {
  taskQueue: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  detection: string;
  rootCause: string;
  remediations: Remediation[];
  stats?: {
    backlogCount: number;
    backlogAge: string;
    tasksAddRate: number;
    tasksDispatchRate: number;
    pollerCount: number;
  };
  affectedWorkers?: string[];
  correlations?: EventCorrelation[];
};

export type TaskQueueStats = {
  approximateBacklogCount?: number;
  approximateBacklogAge?: string;
  tasksAddRate?: number;
  tasksDispatchRate?: number;
};

export type TaskQueueData = {
  taskQueue: string;
  pollers: PollerInfo[];
  stats: TaskQueueStats;
  workers: WorkerSummary[];
};

export type WorkerSummary = {
  identity: string;
  isHealthy: boolean;
  lastHeartbeatTime?: string;
  slotsAvailable?: number;
  slotsUsed?: number;
};

const STALE_HEARTBEAT_THRESHOLD_MS = 60_000;
const BACKLOG_GROWTH_RATIO = 1.5;

function isStaleHeartbeat(
  lastHeartbeat: string | undefined,
  thresholdMs = STALE_HEARTBEAT_THRESHOLD_MS,
): boolean {
  if (!lastHeartbeat) return true;
  const elapsed = Date.now() - new Date(lastHeartbeat).getTime();
  return elapsed > thresholdMs;
}

export function detectInsights(data: TaskQueueData): TaskQueueInsight[] {
  const insights: TaskQueueInsight[] = [];

  const hasBacklog = (data.stats.approximateBacklogCount ?? 0) > 0;
  const hasPollers = data.pollers.length > 0;

  if (!hasPollers && hasBacklog) {
    insights.push({
      taskQueue: data.taskQueue,
      type: 'NO_WORKERS',
      severity: 'critical',
      title: 'No Workers Detected',
      detection: `Missing pollers with ${data.stats.approximateBacklogCount} tasks in backlog`,
      rootCause: 'Misconfigured task queue name or connectivity failure',
      remediations: [
        {
          label: 'Verify task queue name',
          description:
            'Ensure the task queue name in your worker matches the one used by workflow starters.',
        },
        {
          label: 'Restart worker',
          description:
            'Check that workers are running and can reach the Temporal server.',
        },
      ],
      stats: buildStats(data),
    });
  }

  const crashingWorkers = data.workers.filter(
    (w) => !w.isHealthy || isStaleHeartbeat(w.lastHeartbeatTime),
  );
  if (crashingWorkers.length > 0) {
    insights.push({
      taskQueue: data.taskQueue,
      type: 'WORKER_CRASHING',
      severity: 'warning',
      title: 'Worker Crashing',
      detection: `${crashingWorkers.length} worker(s) have stopped heartbeating or are unhealthy`,
      rootCause: 'Crash loop or release regression',
      remediations: [
        {
          label: 'View Logs',
          description:
            'Inspect worker logs for crash details or OOM conditions.',
          action: 'view-logs',
        },
        {
          label: 'Roll back release',
          description:
            'If this coincides with a recent deployment, consider rolling back.',
        },
      ],
      stats: buildStats(data),
      affectedWorkers: crashingWorkers.map((w) => w.identity),
    });
  }

  const addRate = data.stats.tasksAddRate ?? 0;
  const dispatchRate = data.stats.tasksDispatchRate ?? 0;
  if (
    addRate > 0 &&
    dispatchRate > 0 &&
    addRate > dispatchRate * BACKLOG_GROWTH_RATIO
  ) {
    insights.push({
      taskQueue: data.taskQueue,
      type: 'POLLER_SHORTAGE',
      severity: 'warning',
      title: 'Poller Shortage',
      detection: `Tasks arriving at ${addRate.toFixed(1)}/s but dispatching at ${dispatchRate.toFixed(1)}/s`,
      rootCause: 'Insufficient pollers for current load',
      remediations: [
        {
          label: 'Scale workers',
          description:
            'Increase the number of worker instances or poller count per worker.',
        },
        {
          label: 'Send Signal',
          description:
            'Signal the server to request workers to increase their poller count.',
          action: 'send-signal',
        },
      ],
      stats: buildStats(data),
    });
  }

  return insights;
}

function buildStats(data: TaskQueueData): TaskQueueInsight['stats'] {
  return {
    backlogCount: data.stats.approximateBacklogCount ?? 0,
    backlogAge: data.stats.approximateBacklogAge ?? '0s',
    tasksAddRate: data.stats.tasksAddRate ?? 0,
    tasksDispatchRate: data.stats.tasksDispatchRate ?? 0,
    pollerCount: data.pollers.length,
  };
}

export function severityOrder(severity: InsightSeverity): number {
  const order: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  return order[severity];
}

export function sortInsightsBySeverity(
  insights: TaskQueueInsight[],
): TaskQueueInsight[] {
  return [...insights].sort(
    (a, b) => severityOrder(a.severity) - severityOrder(b.severity),
  );
}
