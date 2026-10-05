import { useMemo, useState } from 'react';
import { GitBranch, Shuffle } from 'lucide-react';
import { buildBfsSteps, createGraph } from '../algorithms/bfs.js';
import PlaybackControls from '../components/PlaybackControls.jsx';
import usePlayback from '../hooks/usePlayback.js';

export default function Pathfinding() {
  const [graph, setGraph] = useState(() => createGraph());
  const [size, setSize] = useState(16);
  const [start, setStart] = useState(0);
  const [target, setTarget] = useState(15);
  const [mode, setMode] = useState('edge');
  const [selectedNode, setSelectedNode] = useState(null);
  const [delay, setDelay] = useState(300);
  const frames = useMemo(() => buildBfsSteps(graph, start, target), [graph, start, target]);
  const playback = usePlayback(frames, delay);
  const { frame, index, last } = playback;
  const [editMessage, setEditMessage] = useState('Select two nodes to add or remove their connection.');

  const updateEndpoint = (setter, value) => {
    playback.reset();
    setSelectedNode(null);
    setter(value);
    setEditMessage('Endpoint updated. Press Start to find a new path.');
  };
  const newGraph = (count = size) => {
    playback.reset();
    setGraph(createGraph(count, true));
    setStart(0);
    setTarget(count - 1);
    setSelectedNode(null);
    setEditMessage('New map generated. Some maps may have no path; edit connections to experiment.');
  };
  const clickNode = (id) => {
    if (mode === 'start') { updateEndpoint(setStart, id); return; }
    if (mode === 'target') { updateEndpoint(setTarget, id); return; }
    if (selectedNode === null) {
      setSelectedNode(id);
      setEditMessage(`Node ${id + 1} selected. Select another node to toggle their connection.`);
      return;
    }
    if (selectedNode === id) { setSelectedNode(null); setEditMessage('Selection cleared. Select two nodes to edit a connection.'); return; }
    playback.reset();
    const exists = graph.edges.some(([a, b]) => (a === selectedNode && b === id) || (b === selectedNode && a === id));
    setGraph({ ...graph, edges: exists
      ? graph.edges.filter(([a, b]) => !((a === selectedNode && b === id) || (b === selectedNode && a === id)))
      : [...graph.edges, [selectedNode, id]] });
    setEditMessage(`Connection ${selectedNode + 1} ↔ ${id + 1} ${exists ? 'removed' : 'added'}.`);
    setSelectedNode(null);
  };

  return (
    <main className="page-content visualization-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> GRAPH LAB</div>
          <h1>Find the fewest hops.</h1>
          <p>Explore a node map with breadth-first search and watch the shortest path emerge.</p>
        </div>
        <div className="heading-badge"><GitBranch size={16} /> Unweighted, undirected graph</div>
      </div>

      <section className="viz-card settings-card graph-settings" aria-label="BFS parameters">
        <label className="viz-field">Start node
          <select aria-label="Start node" value={start} onChange={(event) => updateEndpoint(setStart, Number(event.target.value))}>
            {graph.nodes.map(({ id }) => <option key={id} value={id}>Node {id + 1}</option>)}
          </select>
        </label>
        <label className="viz-field">Target node
          <select aria-label="Target node" value={target} onChange={(event) => updateEndpoint(setTarget, Number(event.target.value))}>
            {graph.nodes.map(({ id }) => <option key={id} value={id}>Node {id + 1}</option>)}
          </select>
        </label>
        <label className="viz-field">Map size <strong>{size} nodes</strong>
          <input aria-label="Map size" type="range" min="6" max="30" value={size}
            onChange={(event) => { const next = Number(event.target.value); setSize(next); newGraph(next); }} />
        </label>
        <button className="viz-button" onClick={() => newGraph()}><Shuffle size={16} /> New map</button>
      </section>

      <div className="visualizer-grid">
        <section className="viz-card visualization-canvas" aria-label="BFS visualization">
          <div className="viz-card-heading"><h2>Breadth-first search</h2><span className="step-counter">Step {index} / {last}</span></div>
          <div className="graph-toolbar" role="group" aria-label="Map editing mode">
            {[['edge', 'Toggle edge'], ['start', 'Set start'], ['target', 'Set target']].map(([value, label]) => (
              <button key={value} className={`viz-button ${mode === value ? 'chosen' : ''}`} aria-pressed={mode === value}
                onClick={() => { setMode(value); setSelectedNode(null); setEditMessage(value === 'edge' ? 'Select two nodes to add or remove their connection.' : `Select a node to set the ${value}.`); }}>{label}</button>
            ))}
          </div>
          <p className="graph-edit-message" aria-live="polite">{editMessage}</p>
          <div className="legend graph-legend">
            <span><i className="legend-dot start" /> Start</span><span><i className="legend-dot target" /> Target</span>
            <span><i className="legend-dot queued" /> Queued</span><span><i className="legend-dot active" /> Current</span>
            <span><i className="legend-dot visited" /> Explored</span><span><i className="legend-dot done" /> Path</span>
          </div>
          <svg className="graph-map" viewBox="0 0 900 470" aria-label="Editable node map. Use the mode buttons, then click or keyboard-select nodes.">
            {graph.edges.map(([a, b]) => {
              const position = frame.path.indexOf(a);
              const onPath = position >= 0 && (frame.path[position + 1] === b || frame.path[position - 1] === b);
              return <line key={[a, b].sort((x, y) => x - y).join('-')} className={`graph-edge ${onPath ? 'on-path' : ''}`}
                x1={graph.nodes[a].x} y1={graph.nodes[a].y} x2={graph.nodes[b].x} y2={graph.nodes[b].y} />;
            })}
            {graph.nodes.map(({ id, x, y }) => {
              const state = frame.path.includes(id) ? 'on-path' : frame.current === id ? 'current' : frame.visited.includes(id) ? 'explored' : frame.discovered.includes(id) ? 'queued' : '';
              return <g key={id} className={`graph-node ${state} ${id === start ? 'is-start' : ''} ${id === target ? 'is-target' : ''} ${id === selectedNode ? 'selected' : ''}`}
                transform={`translate(${x} ${y})`} role="button" tabIndex={0}
                aria-label={`Node ${id + 1}${id === start ? ', start' : ''}${id === target ? ', target' : ''}. ${mode === 'edge' ? 'Toggle connection' : `Set ${mode}`}`}
                onClick={() => clickNode(id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); clickNode(id); } }}>
                <circle className="node-ring" r="29" /><circle className="node-body" r="23" />
                <text textAnchor="middle" dy="5" className="node-number">{id + 1}</text>
                {(id === start || id === target) && <text textAnchor="middle" y="-36" className="node-caption">{id === start && id === target ? 'START / TARGET' : id === start ? 'START' : 'TARGET'}</text>}
                {frame.distances[id] !== undefined && <text textAnchor="middle" y="43" className="node-distance">d = {frame.distances[id]}</text>}
              </g>;
            })}
          </svg>
          <div className={`step-message ${frame.complete && !frame.found ? 'no-path' : ''}`} aria-live={playback.playing ? 'off' : 'polite'}>{frame.message}</div>
          <div className="viz-progress" role="progressbar" aria-label="BFS progress" aria-valuemin={0} aria-valuemax={last} aria-valuenow={index}>
            <span style={{ width: `${index / last * 100}%` }} />
          </div>
          <PlaybackControls playback={playback} delay={delay} onDelayChange={setDelay} />
        </section>

        <aside className="viz-sidebar">
          <section className="viz-card info-card">
            <div className="section-label">THE BFS QUEUE</div><h2>First in, first out.</h2>
            <p>Front → back. Discover neighbors, enqueue them once, and explore nodes level by level.</p>
            <div className="queue-list" aria-label="Pending BFS queue">
              {frame.queue.length ? frame.queue.map((id) => <span key={id}>{id + 1}</span>) : <span className="queue-empty">Empty</span>}
            </div>
            <div className="live-metrics"><div><strong>{frame.discovered.length}</strong><span>Discovered</span></div><div><strong>{frame.visited.length}</strong><span>Explored</span></div></div>
          </section>
          <section className="viz-card info-card">
            <div className="section-label">SHORTEST PATH</div>
            <h2>{frame.complete ? frame.found ? `${frame.path.length - 1} ${frame.path.length === 2 ? 'hop' : 'hops'}` : 'No route found' : 'Waiting for the target'}</h2>
            <p>{frame.path.length ? frame.path.map((id) => id + 1).join(' → ') : 'The green path appears once BFS reaches the target.'}</p>
            <div className="algorithm-metrics"><div><span>Time</span><strong>O(V + E)</strong></div><div><span>Auxiliary space</span><strong>O(V)</strong></div></div>
          </section>
          <div className="viz-tip">Each edge costs one hop, regardless of its drawn length. BFS finds a shortest path on this map. For weighted edges, use an algorithm such as Dijkstra.</div>
        </aside>
      </div>
    </main>
  );
}
