'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Account, Task, Opportunity, Stakeholder, Comment } from '@/lib/crmTypes';
import { SAMPLE_ACCOUNTS } from '@/lib/crmData';

interface CrmState {
  accounts: Account[];
  selectedAccountId: string | null;
}

type Action =
  | { type: 'SELECT_ACCOUNT'; id: string | null }
  | { type: 'ADD_ACCOUNT'; account: Account }
  | { type: 'ADD_TASK'; accountId: string; task: Task }
  | { type: 'UPDATE_TASK'; accountId: string; task: Task }
  | { type: 'DELETE_TASK'; accountId: string; taskId: string }
  | { type: 'ADD_STAKEHOLDER'; accountId: string; stakeholder: Stakeholder }
  | { type: 'ADD_OPPORTUNITY'; accountId: string; opportunity: Opportunity }
  | { type: 'UPDATE_OPPORTUNITY'; accountId: string; opportunity: Opportunity }
  | { type: 'UPDATE_ACCOUNT_DESC'; accountId: string; description: string }
  | { type: 'ADD_COMMENT'; accountId: string; taskId: string; comment: Comment };

function reducer(state: CrmState, action: Action): CrmState {
  switch (action.type) {
    case 'SELECT_ACCOUNT':
      return { ...state, selectedAccountId: action.id };

    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.account],
        selectedAccountId: action.account.id,
      };

    case 'ADD_TASK':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.accountId
            ? { ...a, tasks: [...a.tasks, action.task] }
            : a
        ),
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.accountId
            ? { ...a, tasks: a.tasks.map(t => t.id === action.task.id ? action.task : t) }
            : a
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.accountId
            ? { ...a, tasks: a.tasks.filter(t => t.id !== action.taskId) }
            : a
        ),
      };

    case 'ADD_STAKEHOLDER':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.accountId
            ? { ...a, stakeholders: [...a.stakeholders, action.stakeholder] }
            : a
        ),
      };

    case 'ADD_OPPORTUNITY':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.accountId
            ? { ...a, opportunities: [...a.opportunities, action.opportunity] }
            : a
        ),
      };

    case 'UPDATE_OPPORTUNITY':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.accountId
            ? { ...a, opportunities: a.opportunities.map(o => o.id === action.opportunity.id ? action.opportunity : o) }
            : a
        ),
      };

    case 'UPDATE_ACCOUNT_DESC':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.accountId ? { ...a, description: action.description } : a
        ),
      };

    case 'ADD_COMMENT':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.accountId
            ? { ...a, tasks: a.tasks.map(t =>
                t.id === action.taskId
                  ? { ...t, comments: [...(t.comments ?? []), action.comment] }
                  : t
              )}
            : a
        ),
      };

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

  return (
    <CrmContext.Provider value={{ state, dispatch }}>
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used within CrmProvider');
  return ctx;
}
