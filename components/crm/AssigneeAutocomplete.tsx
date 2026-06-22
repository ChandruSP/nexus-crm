'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  Avatar,
  Tag,
  tokens,
} from '@fluentui/react-components';

interface Person { name: string; email: string }

interface Props {
  value: string;
  onChange: (name: string) => void;
  style?: React.CSSProperties;
}

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return dark;
}

export function AssigneeAutocomplete({ value, onChange, style }: Props) {
  const [query, setQuery]     = useState('');
  const [options, setOptions] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const isDark = useIsDark();

  const selected: string[] = value ? [value] : [];

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ad-users?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setOptions(Array.isArray(data) ? data : []);
    } catch {
      setOptions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <FluentProvider
      theme={isDark ? webDarkTheme : webLightTheme}
      style={{ background: 'transparent', ...style }}
    >
      <TagPicker
        selectedOptions={selected}
        onOptionSelect={(_, data) => {
          if (data.selectedOptions.length === 0) {
            onChange('');
          } else {
            onChange(data.selectedOptions[data.selectedOptions.length - 1]);
          }
        }}
      >
        <TagPickerControl>
          <TagPickerGroup>
            {value && (
              <Tag
                key={value}
                value={value}
                shape="circular"
                media={<Avatar name={value} color="colorful" size={20} />}
                dismissible
              >
                {value}
              </Tag>
            )}
          </TagPickerGroup>
          {!value && (
            <TagPickerInput
              placeholder="Search and assign…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          )}
        </TagPickerControl>
        <TagPickerList>
          {loading && (
            <TagPickerOption value="__loading__" text="Searching…">
              Searching…
            </TagPickerOption>
          )}
          {!loading && options.length === 0 && (
            <TagPickerOption value="__empty__" text="No results">
              {query ? 'No results found' : 'Type to search directory…'}
            </TagPickerOption>
          )}
          {!loading && options
            .filter(p => p.name !== value)
            .map(p => (
              <TagPickerOption
                key={p.email || p.name}
                value={p.name}
                text={p.name}
                media={<Avatar name={p.name} color="colorful" size={24} />}
              >
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                  {p.email && <span style={{ fontSize: 11, opacity: 0.65 }}>{p.email}</span>}
                </span>
              </TagPickerOption>
            ))}
        </TagPickerList>
      </TagPicker>
    </FluentProvider>
  );
}
