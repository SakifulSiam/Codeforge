import { useMemo, useState } from 'react';
import { BarChart3, Shuffle } from 'lucide-react';
import { buildSortingSteps, createArray, sortingAlgorithms } from '../algorithms/sorting.js';
import PlaybackControls from '../components/PlaybackControls.jsx';
import usePlayback from '../hooks/usePlayback.js';

export default function Sorting() {
  const [algorithm, setAlgorithm] = useState('bubble');
  const [size, setSize] = useState(24);
  const [order, setOrder] = useState('random');
  const [values, setValues] = useState(() => createArray(24));
  const [delay, setDelay] = useState(100);
  const frames = useMemo(() => buildSortingSteps(values, algorithm), [values, algorithm]);
  const playback = usePlayback(frames, delay);
  const { frame, index, last } = playback;
  const info = sortingAlgorithms[algorithm];

  const regenerate = (nextSize = size, nextOrder = order) => {
    playback.reset();
    setValues(createArray(nextSize, nextOrder));
  };
  const changeAlgorithm = (event) => {
    playback.reset();
    setAlgorithm(event.target.value);
  };

  return (
    <main className="page-content visualization-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> SORTING LAB</div>
          <h1>See order take shape.</h1>
          <p>Watch five sorting algorithms work on the same array, one step at a time.</p>
        </div>
        <div className="heading-badge"><BarChart3 size={16} /> Runs in your browser</div>
      </div>

      <section className="viz-card settings-card" aria-label="Sorting parameters">
        <label className="viz-field">Algorithm
          <select aria-label="Algorithm" value={algorithm} onChange={changeAlgorithm}>
            {Object.entries(sortingAlgorithms).map(([key, item]) => <option key={key} value={key}>{item.name}</option>)}
          </select>
        </label>
        <label className="viz-field">Sample size <strong>{size} values</strong>
          <input aria-label="Sample size" type="range" min="5" max="80" value={size}
            onChange={(event) => { const next = Number(event.target.value); setSize(next); regenerate(next); }} />
        </label>
        <label className="viz-field">Input order
          <select aria-label="Input order" value={order} onChange={(event) => { setOrder(event.target.value); regenerate(size, event.target.value); }}>
            <option value="random">Random</option><option value="sorted">Already sorted</option>
            <option value="reversed">Reverse sorted</option><option value="duplicates">Few unique values</option>
          </select>
        </label>
        <button className="viz-button" onClick={() => regenerate()}><Shuffle size={16} /> New array</button>
      </section>

      <div className="visualizer-grid">
        <section className="viz-card visualization-canvas" aria-label="Sorting visualization">
          <div className="viz-card-heading"><h2>{info.name}</h2><span className="step-counter">Step {index} / {last}</span></div>
          <div className="legend">
            <span><i className="legend-dot default" /> Unsorted</span><span><i className="legend-dot active" /> Active</span>
            <span><i className="legend-dot pivot" /> Pivot</span><span><i className="legend-dot done" /> Final position</span>
          </div>
          <div className="sort-bars" role="img" aria-label={`Array values: ${frame.values.join(', ')}`}>
            {frame.values.map((value, position) => {
              const state = frame.sorted.includes(position) ? 'done' : frame.pivot === position ? 'pivot' : frame.active.includes(position) ? 'active' : '';
              return <div className={`sort-bar ${state}`} key={position} style={{ height: `${value}%` }} title={`Position ${position + 1}: ${value}`}>
                {size <= 35 && <span>{value}</span>}
              </div>;
            })}
          </div>
          <div className="step-message" aria-live={playback.playing ? 'off' : 'polite'}>{frame.message}</div>
          <div className="viz-progress" role="progressbar" aria-label="Sorting progress" aria-valuemin={0} aria-valuemax={last} aria-valuenow={index}>
            <span style={{ width: `${index / last * 100}%` }} />
          </div>
          <PlaybackControls playback={playback} delay={delay} onDelayChange={setDelay} />
        </section>

        <aside className="viz-sidebar">
          <section className="viz-card info-card">
            <div className="section-label">HOW IT WORKS</div><h2>{info.name}</h2><p>{info.description}</p>
            <div className="algorithm-metrics"><div><span>Worst-case time</span><strong>{info.time}</strong></div><div><span>Auxiliary space</span><strong>{info.space}</strong></div></div>
          </section>
          <section className="viz-card info-card">
            <div className="section-label">LIVE COUNTERS</div>
            <div className="live-metrics"><div><strong>{frame.comparisons}</strong><span>Value comparisons</span></div><div><strong>{frame.writes}</strong><span>Array writes</span></div></div>
            <p>One swap counts as two array writes. Reset reuses the array; New array generates another sample.</p>
          </section>
          <div className="viz-tip">Try reverse-sorted input, then switch algorithms to compare their behavior. Changing the algorithm keeps the original array.</div>
        </aside>
      </div>
    </main>
  );
}
