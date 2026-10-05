import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';

export default function PlaybackControls({ playback, delay, onDelayChange }) {
  const { index, last, playing, toggle, step, reset } = playback;
  return (
    <div className="playback-controls">
      <div className="playback-buttons">
        <button className="viz-button primary" onClick={toggle}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? 'Pause' : index >= last ? 'Replay' : index > 0 ? 'Resume' : 'Start'}
        </button>
        <button className="viz-button" onClick={step} disabled={index >= last}>
          <SkipForward size={16} /> Step
        </button>
        <button className="viz-button" onClick={reset}><RotateCcw size={16} /> Reset</button>
      </div>
      <label className="speed-control">
        <span>Speed <strong>{delay} ms / step</strong></span>
        <input aria-label="Animation delay" type="range" min="20" max="800" step="20"
          value={delay} onChange={(event) => onDelayChange(Number(event.target.value))} />
        <small>Faster <span>Slower</span></small>
      </label>
    </div>
  );
}
