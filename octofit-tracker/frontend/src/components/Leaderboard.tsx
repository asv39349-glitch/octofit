import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  const loadData = useCallback(
    () => getJson<{ leaderboard: unknown[] }>('/api/leaderboard').then(({ leaderboard }) => leaderboard),
    [],
  );

  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    loadData={loadData}
    emptyText="No leaderboard rankings yet."
  />;
}
