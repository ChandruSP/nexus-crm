'use client';
import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface ConfigState {
  industries:    string[];
  teamMembers:   string[];
  oppStages:     string[];
  accountGroups: string[];
}

type Action =
  | { type: 'SET_CONFIG'; config: ConfigState }
  | { type: 'ADD_ITEM';    list: keyof ConfigState; value: string }
  | { type: 'REMOVE_ITEM'; list: keyof ConfigState; value: string }
  | { type: 'MOVE_ITEM';   list: keyof ConfigState; from: number; to: number };

const DEFAULT: ConfigState = {
  industries: [
    'Banking & Finance', 'Supply Chain & Logistics', 'Healthcare & Life Sciences',
    'Media & Entertainment', 'Technology', 'Manufacturing', 'Retail',
    'Real Estate', 'Education', 'Government', 'Telecom', 'Energy',
  ],
  teamMembers:   ['Priya Nair', 'Dev Sharma', 'Tanvi Kapila', 'Tech Team', 'Finance'],
  oppStages:     ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
  accountGroups: [],
};

function reducer(state: ConfigState, action: Action): ConfigState {
  if (action.type === 'SET_CONFIG') return action.config;
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

async function persistConfig(list: keyof ConfigState, values: string[]) {
  await fetch('/api/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: list, values }),
  });
}

const ConfigContext = createContext<{
  config: ConfigState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, dispatch] = useReducer(reducer, DEFAULT);

  // Load from API on mount
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => dispatch({ type: 'SET_CONFIG', config: data }))
      .catch(() => {/* keep defaults */});
  }, []);

  // Wrap dispatch to also persist changes
  const apiDispatch: React.Dispatch<Action> = (action) => {
    dispatch(action);
    if (action.type === 'ADD_ITEM' || action.type === 'REMOVE_ITEM' || action.type === 'MOVE_ITEM') {
      // Compute the new list after the action and persist it
      // We re-run the reducer logic here to get the updated list
      const list = [...config[action.list]];
      let updated: string[];
      if (action.type === 'ADD_ITEM') {
        if (!action.value.trim() || list.includes(action.value.trim())) return;
        updated = [...list, action.value.trim()];
      } else if (action.type === 'REMOVE_ITEM') {
        updated = list.filter(v => v !== action.value);
      } else {
        const [item] = list.splice(action.from, 1);
        list.splice(action.to, 0, item);
        updated = list;
      }
      persistConfig(action.list, updated).catch(console.error);
    }
  };

  return <ConfigContext.Provider value={{ config, dispatch: apiDispatch }}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
