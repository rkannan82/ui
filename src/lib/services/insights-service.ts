import type { TaskQueueInsight } from '$lib/utilities/triage-insights';

export type InsightsResult = {
  taskQueue: string;
  insights: TaskQueueInsight[];
  stats: {
    approximateBacklogCount: number;
    approximateBacklogAge: string;
    tasksAddRate: number;
    tasksDispatchRate: number;
  };
  pollerCount: number;
  workerCount: number;
};

export type WorkflowHealthSummary = {
  totalCount: number;
  runningCount: number;
  failedCount: number;
  timedOutCount: number;
  completedCount: number;
  canceledCount: number;
  terminatedCount: number;
  taskFailureCount: number;
};

export type InsightsSummary = {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  results: InsightsResult[];
  allInsights: TaskQueueInsight[];
  workflowHealth: WorkflowHealthSummary | null;
};

type ServerInsight = {
  type: string;
  severity: string;
  category: string;
  resourceId: string;
  title: string;
  detection: string;
  rootCause: string;
  remediations: { label: string; description: string; action?: string }[];
  affectedWorkers?: string[];
};

type ServerTaskQueueContext = {
  taskQueue: string;
  stats: {
    totalBacklogCount: number;
    oldestBacklogAge: string;
    tasksAddRate: number;
    tasksDispatchRate: number;
    activePollerCount: number;
  };
};

type ServerResponse = {
  insights: ServerInsight[];
  taskQueueContexts: ServerTaskQueueContext[];
  summary: {
    taskQueuesEvaluated: number;
    totalInsights: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    healthyQueues: number;
  };
  workflowHealth: WorkflowHealthSummary | null;
};

function mapSeverity(s: string): 'critical' | 'warning' | 'info' {
  if (s === 'critical') return 'critical';
  if (s === 'warning') return 'warning';
  return 'info';
}

function mapInsight(
  si: ServerInsight,
  contextMap: Map<string, ServerTaskQueueContext>,
): TaskQueueInsight {
  const ctx = contextMap.get(si.resourceId);
  return {
    taskQueue: si.resourceId,
    type: si.type as TaskQueueInsight['type'],
    severity: mapSeverity(si.severity),
    title: si.title,
    detection: si.detection,
    rootCause: si.rootCause,
    remediations: si.remediations.map((r) => ({
      label: r.label,
      description: r.description,
      action: r.action as 'view-logs' | 'send-signal' | 'link' | undefined,
    })),
    affectedWorkers: si.affectedWorkers,
    stats: ctx
      ? {
          backlogCount: ctx.stats.totalBacklogCount,
          backlogAge: ctx.stats.oldestBacklogAge,
          tasksAddRate: ctx.stats.tasksAddRate,
          tasksDispatchRate: ctx.stats.tasksDispatchRate,
          pollerCount: ctx.stats.activePollerCount,
        }
      : undefined,
  };
}

export async function getInsightsSummary(
  namespace: string,
  taskQueues?: string[],
): Promise<InsightsSummary> {
  const params = new URLSearchParams({
    includeWorkerDetails: 'true',
  });
  if (taskQueues && taskQueues.length > 0) {
    params.set('taskQueues', taskQueues.join(','));
  }

  const url = `/api/v1/namespaces/${encodeURIComponent(namespace)}/insights?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Insights server returned ${response.status}: ${await response.text()}`,
    );
  }

  const data: ServerResponse = await response.json();

  const contextMap = new Map(
    data.taskQueueContexts.map((c) => [c.taskQueue, c]),
  );

  const allInsights = data.insights.map((si) => mapInsight(si, contextMap));

  const results: InsightsResult[] = data.taskQueueContexts.map((ctx) => {
    const queueInsights = allInsights.filter(
      (i) => i.taskQueue === ctx.taskQueue,
    );
    return {
      taskQueue: ctx.taskQueue,
      insights: queueInsights,
      stats: {
        approximateBacklogCount: ctx.stats.totalBacklogCount,
        approximateBacklogAge: ctx.stats.oldestBacklogAge,
        tasksAddRate: ctx.stats.tasksAddRate,
        tasksDispatchRate: ctx.stats.tasksDispatchRate,
      },
      pollerCount: ctx.stats.activePollerCount,
      workerCount: ctx.stats.activePollerCount,
    };
  });

  for (const insight of allInsights) {
    if (!contextMap.has(insight.taskQueue)) {
      const existing = results.find((r) => r.taskQueue === insight.taskQueue);
      if (!existing) {
        const queueInsights = allInsights.filter(
          (i) => i.taskQueue === insight.taskQueue,
        );
        results.push({
          taskQueue: insight.taskQueue,
          insights: queueInsights,
          stats: {
            approximateBacklogCount: 0,
            approximateBacklogAge: '0s',
            tasksAddRate: 0,
            tasksDispatchRate: 0,
          },
          pollerCount: 0,
          workerCount: 0,
        });
      }
    }
  }

  return {
    totalIssues: data.summary.totalInsights,
    criticalCount: data.summary.criticalCount,
    warningCount: data.summary.warningCount,
    results,
    allInsights,
    workflowHealth: data.workflowHealth,
  };
}
