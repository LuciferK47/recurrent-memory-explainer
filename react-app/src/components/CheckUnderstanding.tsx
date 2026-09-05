import React, { useState } from 'react';

export const CheckUnderstanding: React.FC = () => {
  const [response, setResponse] = useState('');

  return (
    <div className="bg-linen border border-border border-l-4 border-l-ink rounded-lg p-6 my-8 shadow-sm">
      <h3 className="text-lg font-display text-ink mb-2">Check Your Understanding</h3>
      <p className="text-sm text-ink leading-relaxed mb-4">
        In your own words: why does recall degrade after the number of stored associations exceeds the memory dimension <em>d</em>? What would happen if all keys were perfectly orthogonal?
      </p>

      <textarea
        value={response}
        onChange={e => setResponse(e.target.value)}
        placeholder="Type your explanation here…"
        className="w-full min-h-[90px] bg-surface border border-border rounded p-3 text-sm text-ink font-sans focus:outline-none focus:ring-1 focus:ring-memory resize-y"
      />

      <p className="text-xs text-ink-muted mt-2 mb-0 leading-relaxed">
        <strong>Hint:</strong> Think about what happens to M·q when q is similar to multiple stored keys. If keys are orthogonal, cross-terms vanish — but in d dimensions, you can only have d orthogonal vectors.
      </p>
    </div>
  );
};
