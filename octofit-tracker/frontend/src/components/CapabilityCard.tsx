import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ApiRecord = Record<string, unknown>;

type Props = {
  title: string;
  description: string;
  endpoint: string;
  collection: string;
  emptyText: string;
};

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return String(value);
  return '';
}

export function CapabilityCard({ title, description, endpoint, collection, emptyText }: Props) {
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setState('loading');
    getJson<Record<string, unknown>>(endpoint)
      .then((response) => {
        const result = response[collection];
        if (!Array.isArray(result) || !result.every(isApiRecord)) {
          throw new Error(`Invalid ${collection} response`);
        }
        if (active) {
          setRecords(result);
          setState('success');
        }
      })
      .catch(() => {
        if (active) setState('error');
      });

    return () => {
      active = false;
    };
  }, [collection, endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state === 'error' && <p role="alert">Unable to load {title.toLowerCase()}.</p>}
        {state === 'success' && records.length === 0 && <p>{emptyText}</p>}
        {state === 'success' && records.length > 0 && (
          <ul className="list-group list-group-flush">
            {records.map((record, index) => {
              const primary = record.title ?? record.name ?? record.teamName ?? record.type ?? `${title} ${index + 1}`;
              return (
                <li className="list-group-item" key={String(record._id ?? index)}>
                  <h3 className="h5">{displayValue(primary)}</h3>
                  {Object.entries(record)
                    .filter(([key, value]) => key !== '_id' && value !== primary)
                    .map(([key, value]) => (
                      <p className="mb-1" key={key}>{key}: {displayValue(value)}</p>
                    ))}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
