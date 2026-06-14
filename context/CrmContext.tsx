'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Account, Task, Opportunity, Stakeholder, PastProject, Comment, Attachment } from '@/lib/crmTypes';
import { SAMPLE_ACCOUNTS } from '@/lib/crmData';

interface CrmState {
  accounts: Account[];
  selectedAccountId: string | null;
}

type Action =
  | { type: 'SELECT_ACCOUNT'; id: string | null }
  | { type: 'ADD_ACCOUNT'; account: Account }
  | { type: 'UPDATE_ACCOUNT'; account: Account }
  | { type: 'DELETE_ACCOUNT'; accountId: string }
  | { type: 'ADD_TASK'; accountId: string; task: Task }
  | { type: 'UPDATE_TASK'; accountId: string; task: Task }
  | { type: 'DELETE_TASK'; accountId: string; taskId: string }
  | { type: 'ADD_STAKEHOLDER'; accountId: string; stakeholder: Stakeholder }
  | { type: 'UPDATE_STAKEHOLDER'; accountId: string; stakeholder: Stakeholder }
  | { type: 'DELETE_STAKEHOLDER'; accountId: string; stakeholderId: string }
  | { type: 'ADD_PAST_PROJECT'; accountId: string; project: PastProject }
  | { type: 'UPDATE_PAST_PROJECT'; accountId: string; project: PastProject }
  | { type: 'DELETE_PAST_PROJECT'; accountId: string; projectId: string }
  | { type: 'ADD_OPPORTUNITY'; accountId: string; opportunity: Opportunity }
  | { type: 'UPDATE_OPPORTUNITY'; accountId: string; opportunity: Opportunity }
  | { type: 'DELETE_OPPORTUNITY'; accountId: string; opportunityId: string }
  | { type: 'UPDATE_ACCOUNT_DESC'; accountId: string; description: string }
  | { type: 'ADD_COMMENT'; accountId: string; taskId: string; comment: Comment }
  | { type: 'ADD_ATTACHMENT'; accountId: string; attachment: Attachment }
  | { type: 'DELETE_ATTACHMENT'; accountId: string; attachmentId: string };

function patchAccount(state: CrmState, accountId: string, patch: (a: Account) => Account): CrmState {
  return { ...state, accounts: state.accounts.map(a => a.id === accountId ? patch(a) : a) };
}

function reducer(state: CrmState, action: Action): CrmState {
  switch (action.type) {
    case 'SELECT_ACCOUNT':
      return { ...state, selectedAccountId: action.id };

    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.account], selectedAccountId: action.account.id };

    case 'UPDATE_ACCOUNT':
      return patchAccount(state, action.account.id, () => action.account);

    case 'DELETE_ACCOUNT': {
      const remaining = state.accounts.filter(a => a.id !== action.accountId);
      return { ...state, accounts: remaining, selectedAccountId: remaining[0]?.id ?? null };
    }

    case 'ADD_TASK':
      return patchAccount(state, action.accountId, a => ({ ...a, tasks: [...a.tasks, action.task] }));

    case 'UPDATE_TASK':
      return patchAccount(state, action.accountId, a => ({ ...a, tasks: a.tasks.map(t => t.id === action.task.id ? action.task : t) }));

    case 'DELETE_TASK':
      return patchAccount(state, action.accountId, a => ({ ...a, tasks: a.tasks.filter(t => t.id !== action.taskId) }));

    case 'ADD_STAKEHOLDER':
      return patchAccount(state, action.accountId, a => ({ ...a, stakeholders: [...a.stakeholders, action.stakeholder] }));

    case 'UPDATE_STAKEHOLDER':
      return patchAccount(state, action.accountId, a => ({ ...a, stakeholders: a.stakeholders.map(s => s.id === action.stakeholder.id ? action.stakeholder : s) }));

    case 'DELETE_STAKEHOLDER':
      return patchAccount(state, action.accountId, a => ({ ...a, stakeholders: a.stakeholders.filter(s => s.id !== action.stakeholderId) }));

    case 'ADD_PAST_PROJECT':
      return patchAccount(state, action.accountId, a => ({ ...a, pastProjects: [...a.pastProjects, action.project] }));

    case 'UPDATE_PAST_PROJECT':
      return patchAccount(state, action.accountId, a => ({ ...a, pastProjects: a.pastProjects.map(p => p.id === action.project.id ? action.project : p) }));

    case 'DELETE_PAST_PROJECT':
      return patchAccount(state, action.accountId, a => ({ ...a, pastProjects: a.pastProjects.filter(p => p.id !== action.projectId) }));

    case 'ADD_OPPORTUNITY':
      return patchAccount(state, action.accountId, a => ({ ...a, opportunities: [...a.opportunities, action.opportunity] }));

    case 'UPDATE_OPPORTUNITY':
      return patchAccount(state, action.accountId, a => ({ ...a, opportunities: a.opportunities.map(o => o.id === action.opportunity.id ? action.opportunity : o) }));

    case 'DELETE_OPPORTUNITY':
      return patchAccount(state, action.accountId, a => ({ ...a, opportunities: a.opportunities.filter(o => o.id !== action.opportunityId) }));

    case 'UPDATE_ACCOUNT_DESC':
      return patchAccount(state, action.accountId, a => ({ ...a, description: action.description }));

    case 'ADD_COMMENT':
      return patchAccount(state, action.accountId, a => ({
        ...a,
        tasks: a.tasks.map(t => t.id === action.taskId
          ? { ...t, comments: [...(t.comments ?? []), action.comment] }
          : t
        ),
      }));

    case 'ADD_ATTACHMENT':
      return patchAccount(state, action.accountId, a => ({ ...a, attachments: [...(a.attachments ?? []), action.attachment] }));

    case 'DELETE_ATTACHMENT':
      return patchAccount(state, action.accountId, a => ({ ...a, attachments: (a.attachments ?? []).filter(at => at.id !== action.attachmentId) }));

    default:
      return state;
  }
}

const CrmContext = createContext<{
  state: CrmState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    accounts: SAMPLE_ACCOUNTS,
    selectedAccountId: SAMPLE_ACCOUNTS[0].id,
  });
  return <CrmContext.Provider value={{ state, dispatch }}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used within CrmProvider');
  return ctx;
}
