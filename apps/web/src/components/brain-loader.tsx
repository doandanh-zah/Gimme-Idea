'use client';

import { Component, useEffect, useState, type ReactNode, type ComponentType } from 'react';
import { useNarrativeStage } from '@/lib/narrative-stage';
import { Pause, Play } from 'lucide-react';

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function BrainStageCaption({ locale }: { locale: 'en' | 'vi' }) {
  const stage = useNarrativeStage();
  const labels =
    locale === 'vi'
      ? ['Tín hiệu', 'Kết nối', 'Ý tưởng', 'Thảo luận', 'Xây dựng', 'Cơ hội', 'Kết quả']
      : ['Signals', 'Connections', 'Ideas', 'Discussion', 'Build', 'Opportunity', 'Outcome'];
  return (
    <span>
      {String(stage + 1).padStart(2, '0')} / {labels[stage]}
    </span>
  );
}

export function BrainLoader({ locale = 'en' }: { locale?: 'en' | 'vi' }) {
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [Scene, setScene] = useState<ComponentType<{
    paused: boolean;
    onReady: () => void;
    onFailure: () => void;
  }> | null>(null);
  useEffect(() => {
    const desktop = matchMedia('(min-width: 761px)');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    let disposed = false;
    let generation = 0;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const current = ++generation;
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) clearTimeout(timer);
      if (!desktop.matches || reduce.matches || connection?.saveData) {
        setScene(null);
        return;
      }
      const load = () => {
        void import('./brain-scene')
          .then(({ BrainScene }) => {
            if (!disposed && current === generation) setScene(() => BrainScene);
          })
          .catch(() => {
            /* The SVG remains usable if WebGL code cannot load. */
          });
      };
      if ('requestIdleCallback' in window)
        idle = window.requestIdleCallback(load, { timeout: 2500 });
      else timer = setTimeout(load, 300);
    };
    update();
    desktop.addEventListener('change', update);
    reduce.addEventListener('change', update);
    return () => {
      disposed = true;
      generation++;
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) clearTimeout(timer);
      desktop.removeEventListener('change', update);
      reduce.removeEventListener('change', update);
    };
  }, []);
  return Scene && !failed ? (
    <SceneBoundary>
      <Scene paused={paused} onReady={() => setReady(true)} onFailure={() => setFailed(true)} />
      {ready && (
        <button
          className="brain-motion-toggle"
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          {locale === 'vi'
            ? paused
              ? 'Tiếp tục chuyển động'
              : 'Dừng chuyển động'
            : paused
              ? 'Resume motion'
              : 'Pause motion'}
        </button>
      )}
    </SceneBoundary>
  ) : null;
}
