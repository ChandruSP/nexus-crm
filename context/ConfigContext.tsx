'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';

export interface ConfigState {
  industries:  string[];
  teamMembers: string[];
  oppStages:   string[];
}

type Action =
  | { type: 'ADD_ITEM';    list: keyof ConfigState; value: string }
  | { type: 'REMOVE_ITEM'; list: keyof ConfigState; value: string }
  | { type: 'MOVE_ITEM';   list: keyof ConfigState; from: number; to: number };

const DEFAULT: ConfigState = {
  industries: [
    'Banking & Finance', 'Supply Chain & Logistics', 'Healthcare & Life Sciences',
    'Media & Entertainment', 'Technology', 'Manufacturing', 'Retail',
    'Real Estate', 'Education', 'Government', 'Telecom', 'Energy',
  ],
  teamMembers: ['Priya Nair', 'Dev Sharma', 'Tanvi Kapila', 'Tech Team', 'Finance'],
  oppStages:   ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
};

function reducer(state: ConfigState, action: Action): ConfigState {
  const list = [...state[action.list]];
  switch (action.type) {
    case 'ADD_ITEM':
      if (!action.value.trim() || list.includes(action.value.trim())) return state;
      return { ...state, [action.list]: [...list, action.value.trim()] };
    case 'REMOVE_ITEM':
      return { ...state, [action.list]: list.filter(v => v !== action.value) };
    case 'MOVE_ITEM': {
      const [item] = list.splice(action.from, 1);
      list.splice(action.to, 0, item);
      return { ...state, [action.list]: list };
    }
    default: return state;
  }
}

const ConfigContext = createContext<{
  config: ConfigState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, dispatch] = useReducer(reducer, DEFAULT);
  return <ConfigContext.Provider value={{ config, dispatch }}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
