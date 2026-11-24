import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  const loadData = useCallback(
    () => getJson<{ suggestions: unknown[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then(({ suggestions }) => suggestions),
    [],
  );

  return <CapabilityCard
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    loadData={loadData}
    emptyText="No workout suggestions yet."
  />;
}
