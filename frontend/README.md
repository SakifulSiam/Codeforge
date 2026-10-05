# CODEFORGE frontend

React + JavaScript with a C++ editor and two browser-only algorithm visualization pages. React Router handles navigation between the pages. The backend is unchanged.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and npm.

Open a terminal inside `frontend`:

```sh
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

```sh
npm run build
npm run preview
```

The build output is in `dist/`.

## Pages

| Route | Features |
| --- | --- |
| `/` | Existing C++ editor, analysis, code execution, undo/redo, examples, and standard input |
| `/sorting` | Bubble, insertion, selection, merge, and quick sort visualizations |
| `/pathfinding` | BFS shortest path on an editable, unweighted, undirected node map |

### Sorting

- Select an algorithm, sample size (5–80 values), and input order: random, sorted, reversed, or few unique values.
- Start, pause, resume, advance one step, reset, or replay the animation.
- Adjust speed (20–800 milliseconds per step), including during playback. Lower delay is faster.
- Watch active values, the quick-sort pivot, final positions, comparisons, and array writes. A swap counts as two writes.
- Switching algorithms preserves the original sample for comparison. Reset reuses it; **New array** generates another sample.
- During insertion and merge sort, temporary duplicate values can appear as values are shifted or copied back from buffers. The step description explains the held or buffered value.

### BFS map

- Choose start and target using the dropdowns or **Set start** / **Set target**, then click a node.
- In **Toggle edge** mode, click two nodes to add or remove the connection between them. Click the selected node again to cancel.
- Nodes also support keyboard focus and Enter/Space activation.
- Change map size (6–30 nodes), generate a new map, and adjust animation speed.
- Watch the FIFO queue, discovered and explored nodes, distances from the start, and the final green path.
- All edges cost one hop. Drawn edge lengths do not affect BFS. The result has the fewest edges; several equally short paths may exist.
- Disconnected maps show **No route found**. Using the same node as start and target returns zero hops.
- Changing the map or endpoints resets playback; Reset keeps the current map.

Both visualization pages run entirely in the browser and need no API or backend. Algorithm time/space figures describe the algorithms; animation snapshots have additional storage costs.

## Existing backend APIs

Start the C++ backend on `http://127.0.0.1:18080` to use Studio analysis or execution. Vite proxies `/api` requests there during development.

| Request | JSON payload |
| --- | --- |
| `POST /api/analyze-complexity` | `{ "source_code": "..." }` |
| `POST /api/run-code` | `{ "source_code": "...", "input": "..." }` |

The analyzer responds with `timeComplexity`, `spaceComplexity`, and `detectedStructures`. The runner responds with `output`, `exitCode`, and `timedOut`. The analyzed function should be named `algorithm`; helpers are allowed. Complexity estimates are heuristic.

## Production hosting

Serve `dist/` and configure your host to return `index.html` for frontend routes such as `/sorting` and `/pathfinding`. This allows direct links and refreshes with BrowserRouter. Keep `/api` requests routed to the backend; Vite's development proxy is not included in production builds.

## Source layout

- `src/App.jsx`: simple route definitions
- `src/components/Header.jsx`: shared navigation
- `src/Studio.jsx`: existing editor and API behavior
- `src/pages/Sorting.jsx` and `src/pages/Pathfinding.jsx`: visualization pages
- `src/algorithms/sorting.js` and `src/algorithms/bfs.js`: algorithms and animation frames
- `src/hooks/usePlayback.js`: shared playback timer
- `src/components/PlaybackControls.jsx`: playback and speed controls
- `src/styles.css`: existing Studio styling
- `src/visualizations.css`: responsive navigation and visualization styling
