import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  const loadData = useCallback(
    () => getJson<{ teams: unknown[] }>('/api/teams').then(({ teams }) => teams),
    [],
  );

  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    loadData={loadData}
    emptyText="No teams yet."
  />;
}
