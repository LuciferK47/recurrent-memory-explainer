import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ScaleFreeBackground } from './components/ScaleFreeBackground';
import { ProblemComparison } from './components/ProblemComparison';
import { MemoryLab, StoredPair } from './components/MemoryLab';
import { BDHModule } from './components/BDHModule';
import { BreakingPoint } from './components/BreakingPoint';
import { CheckUnderstanding } from './components/CheckUnderstanding';
import { EvidencePanel } from './components/EvidencePanel';
import { OpenQuestion } from './components/OpenQuestion';
import { Footer } from './components/Footer';
import { CitationsModal } from './components/CitationsModal';
import { ReadmeModal } from './components/ReadmeModal';
import {
  Matrix,
  Vector,
  createZeroMatrix,
  writeAssociation,
  randomUnitVector,
  createRng,
} from './lib/memory-math';

const PRESET_LABELS = [
  'cat → furry',
  'sky → blue',
  'sun → warm',
  'rain → wet',
  'code → logic',
  'math → proof',
  'music → rhythm',
  'tree → green',
  'fire → hot',
  'ice → cold',
  'book → words',
  'star → bright',
];

export const App: React.FC = () => {
  const [dim, setDim] = useState<number>(8);
  const [matrix, setMatrix] = useState<Matrix>(() => createZeroMatrix(8));
  const [pairs, setPairs] = useState<StoredPair[]>([]);
  const [pairCounter, setPairCounter] = useState<number>(0);
  const [showCitations, setShowCitations] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.hash === '#citations';
  });
  const [showReadme, setShowReadme] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.hash === '#readme';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#citations') {
        setShowCitations(true);
        setShowReadme(false);
      } else if (window.location.hash === '#readme') {
        setShowReadme(true);
        setShowCitations(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Staged hero-load reveal of the preset populating into the matrix, played once
  useEffect(() => {
    const rng = createRng(42);
    let curM = createZeroMatrix(8);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < 4; i++) {
      const t = setTimeout(() => {
        const k = randomUnitVector(8, rng);
        const v = randomUnitVector(8, rng);
        curM = writeAssociation(curM, k, v);
        setMatrix([...curM.map(row => [...row])]);
        setPairs(prev => [
          ...prev,
          {
            id: `preset-${i}`,
            key: k,
            value: v,
            label: PRESET_LABELS[i],
          },
        ]);
        setPairCounter(i + 1);
      }, i * 140);
      timeouts.push(t);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // Handle Dimension Change in Memory Lab
  const handleDimChange = useCallback((newDim: number) => {
    setDim(newDim);
    setMatrix(createZeroMatrix(newDim));
    setPairs([]);
    setPairCounter(0);
  }, []);

  // Add 1 Random Pair
  const handleAddPair = useCallback(() => {
    const k = randomUnitVector(dim);
    const v = randomUnitVector(dim);
    const label = PRESET_LABELS[pairCounter % PRESET_LABELS.length] || `Pair ${pairCounter + 1}`;
    const newM = writeAssociation(matrix, k, v);

    setMatrix(newM);
    setPairs(prev => [
      ...prev,
      {
        id: `pair-${Date.now()}-${Math.random()}`,
        key: k,
        value: v,
        label,
      },
    ]);
    setPairCounter(prev => prev + 1);
  }, [dim, matrix, pairCounter]);

  // Add 5 Random Pairs
  const handleAddFive = useCallback(() => {
    let curM = matrix;
    const newPairs: StoredPair[] = [];
    let counter = pairCounter;

    for (let i = 0; i < 5; i++) {
      const k = randomUnitVector(dim);
      const v = randomUnitVector(dim);
      const label = PRESET_LABELS[counter % PRESET_LABELS.length] || `Pair ${counter + 1}`;
      curM = writeAssociation(curM, k, v);
      newPairs.push({
        id: `pair-${Date.now()}-${i}`,
        key: k,
        value: v,
        label,
      });
      counter++;
    }

    setMatrix(curM);
    setPairs(prev => [...prev, ...newPairs]);
    setPairCounter(counter);
  }, [dim, matrix, pairCounter]);

  // Clear Memory
  const handleClear = useCallback(() => {
    setMatrix(createZeroMatrix(dim));
    setPairs([]);
    setPairCounter(0);
  }, [dim]);

  // Add Custom Key-Value Pair
  const handleAddCustomPair = useCallback(
    (k: Vector, v: Vector, label: string) => {
      const newM = writeAssociation(matrix, k, v);
      setMatrix(newM);
      setPairs(prev => [
        ...prev,
        {
          id: `custom-${Date.now()}-${Math.random()}`,
          key: k,
          value: v,
          label,
        },
      ]);
      setPairCounter(prev => prev + 1);
    },
    [matrix]
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-memory/20 relative">
      <ScaleFreeBackground />
      <Navbar />

      <main className="flex-1 relative z-10">
        <Hero storedCount={pairs.length} dim={dim} />
        <ProblemComparison />
        <MemoryLab
          dim={dim}
          setDim={handleDimChange}
          pairs={pairs}
          matrix={matrix}
          onAddPair={handleAddPair}
          onAddFive={handleAddFive}
          onClear={handleClear}
          onAddCustomPair={handleAddCustomPair}
        />
        <BDHModule />
        <BreakingPoint />
        <section className="py-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <CheckUnderstanding />
          </div>
        </section>
        <EvidencePanel />
        <OpenQuestion />
      </main>

      <Footer
        onOpenCitations={() => setShowCitations(true)}
        onOpenReadme={() => setShowReadme(true)}
      />
      <CitationsModal
        isOpen={showCitations}
        onClose={() => {
          setShowCitations(false);
          if (window.location.hash === '#citations') {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />
      <ReadmeModal
        isOpen={showReadme}
        onClose={() => {
          setShowReadme(false);
          if (window.location.hash === '#readme') {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />
    </div>
  );
};
