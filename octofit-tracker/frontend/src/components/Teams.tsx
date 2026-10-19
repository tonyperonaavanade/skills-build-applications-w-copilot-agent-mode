import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getJson<TeamsResponse>('/api/teams')
      .then((data) => {
        if (isMounted) setTeams(data.teams);
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
        <h2 className="h4">Teams</h2>
        {teams === null && !hasError && <p role="status">Loading teams...</p>}
        {hasError && <p role="alert">Unable to load teams.</p>}
        {teams?.length === 0 && <p>No teams yet.</p>}
        {teams && teams.length > 0 && (
          <ul className="list-group list-group-flush">
            {teams.map((team, index) => (
              <li className="list-group-item px-0" key={team._id ?? `${team.name}-${index}`}>
                <strong>{team.name}</strong>
                {team.mascot && <span> ({team.mascot})</span>}
                <div>Members: {team.members.join(', ') || 'None'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
