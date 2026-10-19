import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = { _id?: string; title: string; reason: string };
type SuggestionsResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const userEmail = encodeURIComponent('mona@example.com');
    getJson<SuggestionsResponse>(`/api/workouts/suggestions/${userEmail}`)
      .then((data) => {
        if (isMounted) setSuggestions(data.suggestions);
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
        <h2 className="h4">Workout suggestions</h2>
        {suggestions === null && !hasError && <p role="status">Loading workout suggestions...</p>}
        {hasError && <p role="alert">Unable to load workout suggestions.</p>}
        {suggestions?.length === 0 && <p>No workout suggestions yet.</p>}
        {suggestions && suggestions.length > 0 && (
          <ul className="list-group list-group-flush">
            {suggestions.map((suggestion, index) => (
              <li className="list-group-item px-0" key={suggestion._id ?? `${suggestion.title}-${index}`}>
                <strong>{suggestion.title}</strong>
                <div>{suggestion.reason}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
