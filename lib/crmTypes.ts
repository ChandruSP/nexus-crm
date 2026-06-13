export type TaskStatus   = 'To do' | 'In progress' | 'Done' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type OppStage     = string; // configurable — default values in ConfigContext

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  whatsapp?: boolean;
  notes?: string;
  isPrimary?: boolean;
}

export interface PastProject {
  id: string;
  name: string;
  year: number;
  revenue: number;
  status: 'Completed' | 'Ongoing' | 'Cancelled';
  description?: string;
}

export interface Opportunity {
  id: string;
  name: string;
  value: number;
  stage: OppStage;
  closeDate: string;
  description?: string;
  probability: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignee?: string;
  opportunityId?: string;
  createdAt: number;
  comments: Comment[];
}

export interface Account {
  id: string;
  name: string;
  industry: string;
  segment: 'Enterprise' | 'Mid-Market' | 'SMB';
  description: string;
  website?: string;
  location?: string;
  owner: string;
  stakeholders: Stakeholder[];
  pastProjects: PastProject[];
  opportunities: Opportunity[];
  tasks: Task[];
  createdAt: number;
}
