'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Lock,
  ArrowRight,
  Wind,
  MousePointer2,
} from 'lucide-react';
import { createGame, type GameAPI } from './trash-game';

export default function Home() {
  const mount = useRef<HTMLDivElement>(null),
    game = useRef<GameAPI | null>(null);
  const [state, setState] = useState({
    level: 1,
    score: 0,
    shots: 0,
    made: 0,
    power: 42,
    message: 'Your outie would be proud.',
    transition: false,
    ready: false,
  });
  const [muted, setMuted] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (!mount.current) return;
    try {
      game.current = createGame(mount.current, (s) =>
        setState((v) => ({ ...v, ...s })),
      );
    } catch {
      setError('3D rendering could not start. Please enable WebGL and reload.');
    }
    return () => game.current?.dispose();
  }, []);
  return (
    <main className={state.level === 2 ? 'game beach' : 'game'}>
      <div className="world" ref={mount} />
      <header>
        <a className="brand" href="/" aria-label="Trashketball home">
          <span className="brand-symbol">t.</span> trashketball
          <span className="edition">A LITTLE ESCAPE</span>
        </a>
        <div className="top-actions">
          <span className="live-dot" /> PLAY AT YOUR OWN PACE{' '}
          <button
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            onClick={() => {
              setMuted(!muted);
              game.current?.mute(!muted);
            }}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            aria-label="Restart game"
            onClick={() => game.current?.reset()}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>
      <aside className="level-info">
        <div className="eyebrow">
          <span>0{state.level}</span> / 02 —{' '}
          {state.level === 1 ? 'THE INNIE' : 'THE OUTIE'}
        </div>
        <h1>
          {state.level === 1 ? (
            <>
              Severed from
              <br />
              the ordinary.
            </>
          ) : (
            <>
              Out of office.
              <br />
              Into paradise.
            </>
          )}
        </h1>
        <p>
          {state.level === 1
            ? 'Macrodata can wait. Make the shot.'
            : 'Ocean air. Excellent aim. No meetings.'}
        </p>
        <div className="location">
          <span className="live-dot" />
          {state.level === 1 ? 'THE SEVERED FLOOR' : 'THE COASTAL RETREAT'}
        </div>
      </aside>
      <aside className="scorecard">
        <div className="eyebrow">
          {state.level === 1 ? 'YOUR REFINEMENT' : 'YOUR FREEDOM'}
        </div>
        <div className="score">
          <strong>{String(state.score).padStart(2, '0')}</strong>
          <span>PTS</span>
        </div>
        <div className="score-track">
          <i style={{ width: `${state.level === 1 ? state.score : 100}%` }} />
        </div>
        <div className="goal">
          {state.level === 1 ? (
            <>
              <b>{100 - state.score} points</b> to the coast{' '}
              <ArrowUpRight size={14} />
            </>
          ) : (
            <>Enjoy your well-earned escape.</>
          )}
        </div>
        <div className="stats">
          <div>
            <b>{state.shots}</b>
            <span>THROWS</span>
          </div>
          <div>
            <b>
              {state.shots ? Math.round((state.made / state.shots) * 100) : 0}%
            </b>
            <span>ACCURACY</span>
          </div>
        </div>
      </aside>
      <div className="center-mark">+</div>
      <div
        className="feedback"
        role="status"
        aria-live="polite"
        key={state.message}
      >
        {state.message}
      </div>
      <div className="throw-panel">
        <div className="throw-label">
          <span>
            <MousePointer2 size={14} /> DRAG TO AIM · RELEASE TO THROW
          </span>
          <b>{state.power}%</b>
        </div>
        <div className="power">
          <i style={{ width: `${state.power}%` }} />
          <span />
        </div>
        <p>Pull down for power. Move sideways to aim.</p>
        <div className="keyboard">
          Or use <kbd>←</kbd>
          <kbd>→</kbd> aim · <kbd>↑</kbd>
          <kbd>↓</kbd> power · <kbd>space</kbd> throw
        </div>
      </div>
      <footer>
        <div className="chapter active">
          <span>01</span>
          <div>
            <b>The severed floor</b>
            <small>
              {state.level === 1 ? 'YOU ARE HERE' : 'SHIFT COMPLETE'}
            </small>
          </div>
        </div>
        <div className="chapter-line" />
        <div className={`chapter ${state.level === 2 ? 'active' : ''}`}>
          <span>{state.level === 1 ? <Lock size={15} /> : '02'}</span>
          <div>
            <b>The coastal retreat</b>
            <small>
              {state.level === 1 ? 'UNLOCK AT 100 POINTS' : 'YOU ARE HERE'}
            </small>
          </div>
        </div>
        <div className="physics-note">
          <Wind size={16} /> NO WIND. JUST YOU & GRAVITY.
        </div>
      </footer>
      {error && (
        <div className="modal">
          <h2>One small interruption.</h2>
          <p>{error}</p>
        </div>
      )}
      {state.transition && (
        <div className="veil">
          <div className="modal">
            <div className="eyebrow">REFINEMENT COMPLETE</div>
            <h2>
              Your shift
              <br />
              ends here.
            </h2>
            <p>
              100 points. Ten excellent decisions.
              <br />
              Your outie has a place by the ocean.
            </p>
            <button onClick={() => game.current?.nextLevel()}>
              Head to the coast <ArrowRight size={19} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
