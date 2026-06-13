export type TaskStatus = 'To do' | 'In progress' | 'Done' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type OppStage = 'Prospecting' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface PastProject {
  id: string;
  name: string;
  year: number;
  revenue: number; // in USD
  status: 'Completed' | 'Ongoing' | 'Cancelled';
  description?: string;
}

export interface Opportunity {
  id: string;
  name: string;
  value: number; // in USD
  stage: OppStage;
  closeDate: string; // ISO date
  description?: string;
  probability: number; // 0-100
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date
  assignee?: string;
  opportunityId?: string; // if linked to an opp, else general
  createdAt: number;
}

export interface Account {
  id: string;
  name: string;
  industry: string;
  segment: 'Enterprise' | 'Mid-Market' | 'SMB';
  description: string;
  website?: string;
  location?: string;
  owner: string; // account owner
  stakeholders: Stakeholder[];
  pastProjects: PastProject[];
  opportunities: Opportunity[];
  tasks: Task[];
  createdAt: number;
}
