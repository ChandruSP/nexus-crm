import { Account, Group, Task, Stakeholder, Opportunity, PastProject, Comment, TaskStatus, TaskPriority } from './crmTypes';

function normalizeStatus(s: string): TaskStatus {
  const map: Record<string, TaskStatus> = {
    'to do': 'To do', 'todo': 'To do',
    'in progress': 'In progress', 'inprogress': 'In progress',
    'done': 'Done',
    'blocked': 'Blocked',
  };
  return map[s?.toLowerCase()] ?? 'To do';
}

function normalizePriority(s: string): TaskPriority {
  const map: Record<string, TaskPriority> = {
    'low': 'Low', 'medium': 'Medium', 'high': 'High', 'critical': 'Critical',
  };
  return map[s?.toLowerCase()] ?? 'Medium';
}

// ─── DB → Frontend mappers ────────────────────────────────────────────────────

export function mapAccount(raw: Record<string, unknown>): Account {
  return {
    id: raw.id as string,
    name: raw.name as string,
    industry: raw.industry as string,
    segment: raw.segment as Account['segment'],
    description: (raw.description as string) || '',
    website: raw.website as string | undefined,
    location: raw.location as string | undefined,
    owner: raw.owner as string,
    group: (raw.group as Record<string, unknown> | null)?.name as string | undefined,
    groupId: raw.groupId as string | undefined,
    createdAt: new Date(raw.createdAt as string).getTime(),
    stakeholders: ((raw.contacts as Record<string, unknown>[]) || []).map(mapContact),
    tasks: ((raw.tasks as Record<string, unknown>[]) || []).map(mapTask),
    opportunities: ((raw.opportunities as Record<string, unknown>[]) || []).map(mapOpportunity),
    pastProjects: ((raw.pastProjects as Record<string, unknown>[]) || []).map(mapProject),
    attachments: [],
  };
}

function mapContact(c: Record<string, unknown>): Stakeholder {
  return {
    id: c.id as string,
    name: c.name as string,
    role: (c.role as string) || '',
    email: (c.email as string) || '',
    phone: c.phone as string | undefined,
    isPrimary: c.isPrimary as boolean,
    notes: c.notes as string | undefined,
  };
}

function mapTask(t: Record<string, unknown>): Task {
  const rawComments = (t.comments as string[]) || [];
  const comments: Comment[] = rawComments.map(c => {
    try { return JSON.parse(c) as Comment; }
    catch { return { id: String(Date.now()), text: c, author: 'Unknown', createdAt: Date.now() }; }
  });
  return {
    id: t.id as string,
    title: t.title as string,
    description: t.description as string | undefined,
    status: normalizeStatus(t.status as string),
    priority: normalizePriority(t.priority as string),
    dueDate: t.dueDate ? (t.dueDate as string).split('T')[0] : undefined,
    assignee: t.assignee as string | undefined,
    createdAt: new Date(t.createdAt as string).getTime(),
    comments,
  };
}

function mapOpportunity(o: Record<string, unknown>): Opportunity {
  return {
    id: o.id as string,
    name: (o.title as string) || (o.name as string),
    value: o.value as number,
    stage: o.stage as string,
    closeDate: o.closeDate ? (o.closeDate as string).split('T')[0] : '',
    probability: o.probability as number,
    description: o.notes as string | undefined,
    nextStep: o.nextStep as string | undefined,
  };
}

function mapProject(p: Record<string, unknown>): PastProject {
  return {
    id: p.id as string,
    name: p.name as string,
    year: p.year as number,
    revenue: p.revenue as number,
    status: 'Completed',
    description: p.description as string | undefined,
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchBootstrap(departmentId: string): Promise<{ accounts: Account[]; groups: Group[]; config: Record<string, string[]> }> {
  const res = await fetch(`/api/bootstrap?d=${departmentId}`);
  const data = await res.json();
  return {
    accounts: data.accounts.map(mapAccount),
    groups:   data.groups.map((g: Record<string, unknown>) => ({ id: g.id, name: g.name, industry: g.industry, description: g.description })),
    config:   data.config,
  };
}

export async function fetchAccounts(departmentId: string): Promise<Account[]> {
  const res = await fetch(`/api/accounts?d=${departmentId}`);
  const data = await res.json();
  return data.map(mapAccount);
}

export async function apiCreateAccount(body: Partial<Account>, departmentId: string): Promise<Account> {
  const res = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, departmentId }),
  });
  return mapAccount(await res.json());
}

export async function apiUpdateAccount(id: string, body: Partial<Account>): Promise<void> {
  await fetch(`/api/accounts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiDeleteAccount(id: string): Promise<void> {
  await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
}

export async function apiCreateDeptTask(departmentId: string, task: Task): Promise<Task> {
  const res = await fetch(`/api/departments/${departmentId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: task.title, description: task.description,
      priority: task.priority, status: task.status,
      dueDate: task.dueDate, assignee: task.assignee,
    }),
  });
  return mapTask(await res.json());
}

export async function apiCreateTask(accountId: string, task: Task): Promise<Task> {
  const res = await fetch(`/api/accounts/${accountId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      assignee: task.assignee,
      comments: (task.comments || []).map(c => JSON.stringify(c)),
    }),
  });
  return mapTask(await res.json());
}

export async function apiUpdateTask(accountId: string, task: Task): Promise<void> {
  await fetch(`/api/accounts/${accountId}/tasks/${task.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      assignee: task.assignee,
      comments: (task.comments || []).map(c => JSON.stringify(c)),
    }),
  });
}

export async function apiDeleteTask(accountId: string, taskId: string): Promise<void> {
  await fetch(`/api/accounts/${accountId}/tasks/${taskId}`, { method: 'DELETE' });
}

export async function apiCreateStakeholder(accountId: string, s: Stakeholder): Promise<void> {
  await fetch(`/api/accounts/${accountId}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s),
  });
}

export async function apiUpdateStakeholder(accountId: string, s: Stakeholder): Promise<void> {
  await fetch(`/api/accounts/${accountId}/contacts/${s.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s),
  });
}

export async function apiDeleteStakeholder(accountId: string, stakeholderId: string): Promise<void> {
  await fetch(`/api/accounts/${accountId}/contacts/${stakeholderId}`, { method: 'DELETE' });
}

export async function apiCreateOpportunity(accountId: string, o: Opportunity): Promise<void> {
  await fetch(`/api/accounts/${accountId}/opportunities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: o.name, stage: o.stage, value: o.value, probability: o.probability, closeDate: o.closeDate, notes: o.description, nextStep: o.nextStep }),
  });
}

export async function apiUpdateOpportunity(accountId: string, o: Opportunity): Promise<void> {
  await fetch(`/api/accounts/${accountId}/opportunities/${o.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: o.name, stage: o.stage, value: o.value, probability: o.probability, closeDate: o.closeDate, notes: o.description, nextStep: o.nextStep }),
  });
}

export async function apiDeleteOpportunity(accountId: string, oppId: string): Promise<void> {
  await fetch(`/api/accounts/${accountId}/opportunities/${oppId}`, { method: 'DELETE' });
}

export async function apiCreateProject(accountId: string, p: PastProject): Promise<void> {
  await fetch(`/api/accounts/${accountId}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
}

export async function apiUpdateProject(accountId: string, p: PastProject): Promise<void> {
  await fetch(`/api/accounts/${accountId}/projects/${p.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
}

export async function apiDeleteProject(accountId: string, projectId: string): Promise<void> {
  await fetch(`/api/accounts/${accountId}/projects/${projectId}`, { method: 'DELETE' });
}

export async function fetchGroups(departmentId: string): Promise<Group[]> {
  const res = await fetch(`/api/groups?d=${departmentId}`);
  const data = await res.json();
  return data.map((g: Record<string, unknown>) => ({
    id: g.id as string,
    name: g.name as string,
    industry: g.industry as string,
    description: g.description as string | undefined,
  }));
}

export async function apiCreateGroup(g: { name: string; industry: string; description?: string }, departmentId: string): Promise<Group> {
  const res = await fetch('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...g, departmentId }),
  });
  const data = await res.json();
  return { id: data.id, name: data.name, industry: data.industry, description: data.description };
}

export async function apiUpdateGroup(id: string, g: Partial<Group>): Promise<void> {
  await fetch(`/api/groups/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(g),
  });
}

export async function apiDeleteGroup(id: string): Promise<void> {
  await fetch(`/api/groups/${id}`, { method: 'DELETE' });
}

// ─── Departments ───────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  color: string;
  icon: string;
  hasAccounts: boolean;
}

export async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch('/api/departments');
  return res.json();
}

export async function apiCreateDepartment(d: { name: string; color: string; icon: string; hasAccounts: boolean }): Promise<Department> {
  const res = await fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(d),
  });
  return res.json();
}

export async function apiUpdateDepartment(id: string, d: Partial<Department>): Promise<void> {
  await fetch(`/api/departments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(d),
  });
}

export async function apiDeleteDepartment(id: string): Promise<void> {
  await fetch(`/api/departments/${id}`, { method: 'DELETE' });
}

// ─── Config ────────────────────────────────────────────────────────────────────

export async function fetchConfig(departmentId: string): Promise<Record<string, string[]>> {
  const res = await fetch(`/api/config?d=${departmentId}`);
  return res.json();
}

export async function persistConfig(key: string, values: string[], departmentId: string): Promise<void> {
  await fetch('/api/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, values, departmentId }),
  });
}
