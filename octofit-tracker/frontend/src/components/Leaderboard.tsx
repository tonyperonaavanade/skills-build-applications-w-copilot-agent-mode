import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then((data) => {
        if (isMounted) setEntries(data.leaderboard);
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        {entries === null && !hasError && <p role="status">Loading leaderboard...</p>}
        {hasError && <p role="alert">Unable to load leaderboard.</p>}
        {entries?.length === 0 && <p>No leaderboard entries yet.</p>}
        {entries && entries.length > 0 && (
          <ol className="list-group list-group-numbered list-group-flush">
            {entries.map((entry) => (
              <li className="list-group-item px-0" key={`${entry.rank}-${entry.teamName}`}>
                <strong>{entry.teamName}</strong>: {entry.totalPoints} points
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
