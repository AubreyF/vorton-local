export type Profile = "AubOS" | "FreedOS";
export type Role = "CEO" | "CTO" | "CMO" | "COO" | "CFO";
export type GoalFields = {
  title: string;
  intent: string;
  successCriteria: string;
  owner: string;
  horizon: string;
  priority: string;
  parentId: string;
  reviewOn: string;
  milestones: { title: string; done: boolean }[];
  evidence: string;
  progress: number;
  status: string;
};
export type TaskFields = {
  title: string;
  notes: string;
  goalId: string;
  owner: string;
  dueOn: string;
  status: string;
  priority: string;
};
export type EntityMeta = {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  history: { version: number; at: string; fields: Record<string, unknown> }[];
};
export type Goal = GoalFields & EntityMeta;
export type Task = TaskFields & EntityMeta;
export type Recommendation = {
  id: string;
  role: Role;
  kind: "goal" | "task" | "goal-review" | "task-review";
  targetId: string;
  targetVersion: number | null;
  rationale: string;
  tradeoffs: string;
  confidence: string;
  evidence: string;
  proposal: GoalFields | TaskFields;
  status: string;
  ownerNote?: string;
  resultId?: string;
  createdAt: string;
};
export type State = {
  profile: Profile;
  revision: number;
  goals: Goal[];
  tasks: Task[];
  recommendations: Recommendation[];
  events: {
    id: string;
    at: string;
    action: string;
    subjectId: string;
    actor: string;
    detail: string;
    revision: number;
  }[];
};
