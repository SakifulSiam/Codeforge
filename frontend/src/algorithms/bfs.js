export function createGraph(count = 16, random = false) {
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const nodes = Array.from({ length: count }, (_, id) => ({
    id,
    x: 85 + (id % columns) * (730 / Math.max(1, columns - 1)),
    y: 65 + Math.floor(id / columns) * (340 / Math.max(1, rows - 1)),
  }));
  const edges = [];
  for (let id = 0; id < count; id++) {
    if (id % columns < columns - 1 && id + 1 < count && (!random || Math.random() < 0.7)) edges.push([id, id + 1]);
    if (id + columns < count && (!random || Math.random() < 0.7)) edges.push([id, id + columns]);
    if (random && id % columns < columns - 1 && id + columns + 1 < count && Math.random() < 0.2) edges.push([id, id + columns + 1]);
  }
  // The initial map has a few gaps, while keeping a route across the map.
  return { nodes, edges: random ? edges : edges.filter(([a, b]) => ![[1, 2], [5, 9], [10, 11]].some(([x, y]) => a === x && b === y)) };
}

export function buildBfsSteps(graph, start, target) {
  const adjacency = graph.nodes.map(() => []);
  graph.edges.forEach(([a, b]) => { adjacency[a].push(b); adjacency[b].push(a); });
  const queue = [start];
  const discovered = new Set([start]);
  const visited = [];
  const parents = { [start]: null };
  const distances = { [start]: 0 };
  const frames = [];
  const record = (message, current = null, path = [], complete = false, found = false) => {
    frames.push({ queue: [...queue], discovered: [...discovered], visited: [...visited], distances: { ...distances }, current, path: [...path], message, complete, found });
  };
  record(`Ready. Node ${start + 1} is queued at distance 0.`);
  // A head index avoids shifting the queue for every dequeue.
  let head = 0;
  const recordQueue = (message, current = null, path = [], complete = false, found = false) => {
    record(message, current, path, complete, found);
    frames[frames.length - 1].queue = queue.slice(head);
  };
  while (head < queue.length) {
    const current = queue[head++];
    recordQueue(`Dequeue node ${current + 1} at distance ${distances[current]}.`, current);
    if (current === target) {
      const path = [];
      for (let node = target; node !== null; node = parents[node]) path.push(node);
      path.reverse();
      visited.push(current);
      for (let length = 1; length <= path.length; length++) {
        recordQueue(`Trace the shortest path: ${path.slice(0, length).map((node) => node + 1).join(' → ')}.`, null, path.slice(0, length));
      }
      recordQueue(`Shortest path found: ${path.map((node) => node + 1).join(' → ')} (${path.length - 1} ${path.length === 2 ? 'hop' : 'hops'}).`, null, path, true, true);
      return frames;
    }
    for (const next of adjacency[current]) {
      if (discovered.has(next)) continue;
      discovered.add(next);
      parents[next] = current;
      distances[next] = distances[current] + 1;
      queue.push(next);
      recordQueue(`Discover node ${next + 1} from ${current + 1}; enqueue it at distance ${distances[next]}.`, current);
    }
    visited.push(current);
    recordQueue(`Finish exploring node ${current + 1}.`);
  }
  recordQueue(`No path from node ${start + 1} to node ${target + 1}. The reachable nodes have all been explored.`, null, [], true, false);
  return frames;
}
