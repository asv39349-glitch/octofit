import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  const loadData = useCallback(
    () => getJson<{ activities: unknown[] }>('/api/activities').then(({ activities }) => activities),
    [],
  );

  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    loadData={loadData}
    emptyText="No activities yet."
  />;
}
