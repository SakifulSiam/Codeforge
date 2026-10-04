import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { undo, redo } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import {
  Activity, ArrowRight, Check, ChevronDown, CircleAlert, Clock3, Code2,
  Command, Copy, FileCode2, FolderOpen, GitBranch, Info, Layers3, LoaderCircle,
  PanelRightClose, PanelRightOpen, Play, Redo2, RotateCcw, Search, Sparkles,
  Terminal, Undo2, Zap
} from "lucide-react";

const examples = [
  {
    name: "Binary search", label: "binary_search.cpp", description: "Divide and conquer",
    code: `#include <vector>\nusing namespace std;\n\n// Search a sorted array in logarithmic time.\nint algorithm(const vector<int>& values, int target) {\n    int left = 0;\n    int right = static_cast<int>(values.size()) - 1;\n\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (values[mid] == target) return mid;\n        if (values[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n`,
  },
  {
    name: "Nested loops", label: "nested_loops.cpp", description: "Quadratic traversal",
    code: `#include <vector>\nusing namespace std;\n\nint algorithm(const vector<int>& values) {\n    int pairs = 0;\n    for (int i = 0; i < values.size(); ++i) {\n        for (int j = i + 1; j < values.size(); ++j) {\n            if (values[i] == values[j]) ++pairs;\n        }\n    }\n    return pairs;\n}\n`,
  },
  {
    name: "Breadth-first search", label: "bfs.cpp", description: "Graph traversal",
    code: `#include <vector>\n#include <queue>\nusing namespace std;\n\nvoid algorithm(const vector<vector<int>>& graph, int start) {\n    vector<bool> visited(graph.size(), false);\n    queue<int> pending;\n    pending.push(start);\n    visited[start] = true;\n\n    while (!pending.empty()) {\n        int node = pending.front();\n        pending.pop();\n        for (int next : graph[node]) {\n            if (!visited[next]) {\n                visited[next] = true;\n                pending.push(next);\n            }\n        }\n    }\n}\n`,
  },
];

const storageKey = "codeforge.editor.v1";

async function postJson(url, payload) {
  const response = await fetch(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  const data = await response.json();
  return data;
}

function isAnalysis(value) {
  return typeof value === "object" && value !== null &&
    "timeComplexity" in value && typeof value.timeComplexity === "string" &&
    "spaceComplexity" in value && typeof value.spaceComplexity === "string" &&
    "detectedStructures" in value && Array.isArray(value.detectedStructures) &&
    value.detectedStructures.every((item) => typeof item === "string");
}

function parseExecution(value) {
  const record = value;
  if (record.timedOut) {
    throw new Error("Time Out: The execution took too long and was terminated. Check your code for infinite loops or excessive computation.");
  }
  if (record.exitCode != 0) {
    throw new Error(record.output || "Execution failed with exit code " + record.exitCode);
  }
  return { stdout: record.output, exitCode: record.exitCode, timedOut: record.timedOut };
}

export default function Studio() {
  const [code, setCode] = useState(examples[0].code);
  const [selected, setSelected] = useState(0);
  const [stdin, setStdin] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [execution, setExecution] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [runError, setRunError] = useState("");
  const [tab, setTab] = useState("analysis");
  const [working, setWorking] = useState(null);
  const [resultFor, setResultFor] = useState("");
  const [copied, setCopied] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const editorRef = useRef(null);
  const extensions = useMemo(() => [cpp(), EditorView.updateListener.of((update) => {
    if (update.docChanged || update.selectionSet) {
      const head = update.state.selection.main.head;
      const line = update.state.doc.lineAt(head);
      setCursor({ line: line.number, column: head - line.from + 1 });
    }
  })], []);
  const requestId = useRef(0);
  const uploadRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        setCode(saved);
        setSelected(-1);
      }
    }
    catch { }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(storageKey, code);
      } catch { /* optional */ }
    }
  }, [code, hydrated]);

  const onMount = useCallback((view) => {
    editorRef.current = view;
  }, []);
  const changeCode = useCallback((value) => {
    setCode(value);
  }, []);
  const chooseExample = (index) => {
    requestId.current++;
    setWorking(null);
    setSelected(index);
    setCode(examples[index].code);
    setAnalysis(null);
    setAnalysisError("");
    setExecution(null);
    setRunError("");
    setResultFor("");
    setTab("analysis");
  };
  const analyze = async () => {
    if (!code.trim() || working) return;
    const id = ++requestId.current;
    const source = code;
    setTab("analysis");
    setPanelOpen(true);
    setWorking("analyze");
    setAnalysisError("");
    try {
      const result = await postJson("/api/analyze-complexity", { source_code: source });
      if (id !== requestId.current) return;
      if (!isAnalysis(result)) throw new Error("Analysis API returned an unexpected response.");
      setAnalysis(result);
      setResultFor(source);
    } catch (error) {
      if (id === requestId.current)
        setAnalysisError(error instanceof Error ? error.message : "Analysis failed.");
    }
    finally {
      if (id === requestId.current)
        setWorking(null);
    }
  };
  const run = async () => {
    if (!code.trim() || working) return;
    const id = ++requestId.current;
    setTab("output");
    setPanelOpen(true);
    setWorking("run");
    setRunError("");
    setExecution(null);
    try {
      const result = await postJson("/api/run-code", { source_code: code, input: stdin });
      if (id === requestId.current)
        setExecution(parseExecution(result));
    } catch (error) {
      if (id === requestId.current)
        setRunError(error instanceof Error ? error.message : "Run failed.");
    }
    finally {
      if (id === requestId.current)
        setWorking(null);
    }
  };
  const reset = () => {
    const initial = selected < 0 ? examples[0] : examples[selected];
    editorRef.current?.dispatch(
      {
        changes: {
          from: 0,
          to: editorRef.current.state.doc.length,
          insert: initial.code
        }
      });
    if (!editorRef.current)
      setCode(initial.code);
  };
  const loadFile = async (file) => {
    if (!file) return;
    if (file.size > 200_000) {
      setAnalysisError("Choose a file under 200 KB.");
      setTab("analysis"); return;
    }
    const text = await file.text();
    setCode(text);
    setSelected(-1);
    setAnalysis(null);
    setExecution(null);
    setAnalysisError("");
    setRunError("");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { }
  };
  const lineCount = useMemo(() => code.split("\n").length, [code]);
  const resultIsOld = analysis !== null && resultFor !== code;
  const activeName = selected >= 0 ? examples[selected].label : "untitled.cpp";

  return (
    <div className="app-shell">
      <div className="workspace">
        <header className="topbar">
          <div className="brand-name">
            <span className="brand-code">CODE</span>
            <span className="brand-forge">FORGE</span>
            <span className="brand-divider" />
            <span className="brand-context">Complexity Studio</span>
          </div>
          <div className="topbar-right">
            <span className="status-dot" />
            <span className="topbar-status">Workspace ready</span>
            <span className="topbar-separator" />
            <span className="avatar">CF</span>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> C++ ANALYSIS WORKSPACE
              </div>
              <h1>Write code. Understand it.</h1>
              <p>Explore time and space complexity, one algorithm at a time.</p>
            </div>
            <div className="heading-badge">
              <Sparkles size={16} /> Built for curious minds
            </div>
          </div>

          <div className="studio-grid">
            <section className="editor-column" aria-label="Code editor">
              <div className="editor-card">
                <div className="editor-topline"><div className="section-label"><span className="tiny-purple-dot" /> EDITOR <span className="minor-label">/ C++17</span></div><div className="editor-tools"><button title="Upload a .cpp file" aria-label="Upload code file" onClick={() => uploadRef.current?.click()}><FolderOpen size={16} /></button><button title="Copy code" aria-label="Copy code" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}</button><span className="tool-divider" /><button title="Undo" aria-label="Undo" onClick={() => editorRef.current && undo(editorRef.current)}><Undo2 size={16} /></button><button title="Redo" aria-label="Redo" onClick={() => editorRef.current && redo(editorRef.current)}><Redo2 size={16} /></button><button title="Reset to sample" aria-label="Reset code to sample" onClick={reset}><RotateCcw size={15} /></button></div></div>
                <input ref={uploadRef} type="file" accept=".cpp,.cc,.cxx,.h,.hpp,.txt" hidden onChange={(event) => { void loadFile(event.target.files?.[0]); event.target.value = ""; }} />
                <div className="file-row"><div className="file-tab"><FileCode2 size={15} /><span>{activeName}</span><span className="file-unsaved" /></div><div className="file-meta">C++ <ChevronDown size={13} /></div></div>
                <div className="editor-surface">
                  <CodeMirror
                    value={code}
                    onChange={changeCode}
                    onCreateEditor={onMount}
                    extensions={extensions}
                    theme="dark"
                    basicSetup={
                      {
                        foldGutter: true,
                        lineNumbers: true,
                        highlightActiveLine: true,
                        bracketMatching: true,
                        autocompletion: true
                      }}
                    height="430px" style={{ height: "430px", fontSize: "13.5px" }} />
                </div>
                <div className="editor-status"><div><span className="status-indicator" /> Ready to analyze</div><div>Ln {cursor.line}, Col {cursor.column}<span className="status-sep">·</span>{lineCount} lines<span className="status-sep">·</span>UTF-8</div></div>
              </div>

              <div className="action-bar"><div className="action-hint"><Command size={16} /><span>Name your function <code>algorithm</code> for accurate results</span></div><div className="action-buttons"><button className="run-button" onClick={run} disabled={!!working || !code.trim()}>{working === "run" ? <LoaderCircle size={16} className="spin" /> : <Play size={15} fill="currentColor" />} Run code</button><button className="analyze-button" onClick={analyze} disabled={!!working || !code.trim()}>{working === "analyze" ? <LoaderCircle size={16} className="spin" /> : <Zap size={17} fill="currentColor" />} Analyze complexity <ArrowRight size={16} /></button></div></div>

              <div className="stdin-card"><div className="input-header"><Terminal size={16} /><span>Standard input</span><span className="optional-tag">OPTIONAL</span></div><textarea value={stdin} onChange={(event) => setStdin(event.target.value)} placeholder="Enter input for your program here…" spellCheck={false} aria-label="Standard input for Run API" /><div className="stdin-note">Passed to the Run API as <code>stdin</code>. Analysis ignores input.</div></div>
            </section>

            <aside className={`right-column ${panelOpen ? "" : "collapsed"}`} aria-label="Results and examples">
              <div className="results-card">
                <div className="results-header"><div><div className="section-label"><span className="tiny-orange-dot" /> INSIGHTS</div><h2>Analysis results</h2></div><button className="panel-toggle" onClick={() => setPanelOpen(!panelOpen)} aria-label={panelOpen ? "Collapse results" : "Expand results"}>{panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}</button></div>
                {panelOpen &&
                  <>
                    <div className="tabs" role="tablist" aria-label="Results"><button role="tab" aria-selected={tab === "analysis"} className={tab === "analysis" ? "selected" : ""} onClick={() => setTab("analysis")}><Activity size={15} /> Complexity</button><button role="tab" aria-selected={tab === "output"} className={tab === "output" ? "selected" : ""} onClick={() => setTab("output")}><Terminal size={15} /> Output</button></div>
                    <div className="result-body">
                      {tab === "analysis" ? <>
                        {working === "analyze" && <div className="notice loading"><LoaderCircle size={18} className="spin" /> Analyzing your C++ code…</div>}
                        {analysisError && <div className="notice error"><CircleAlert size={18} /><div><strong>Analysis unavailable</strong><span>{analysisError}</span></div></div>}
                        {analysis ? <><div className="complexity-grid"><div className="metric time"><div className="metric-label"><Clock3 size={15} /> TIME COMPLEXITY</div><div className="metric-value">{analysis.timeComplexity}</div><div className="metric-caption">Estimated growth rate</div></div><div className="metric space"><div className="metric-label"><Layers3 size={15} /> SPACE COMPLEXITY</div><div className="metric-value">{analysis.spaceComplexity}</div><div className="metric-caption">Estimated extra memory</div></div></div>{resultIsOld && <div className="stale-notice">Code changed since this analysis. Analyze again for fresh results.</div>}<div className="structures"><div className="subheading">Detected structures <span>{analysis.detectedStructures.length}</span></div>{analysis.detectedStructures.length ? <div className="structure-list">{analysis.detectedStructures.map((item) => <div className="structure-item" key={item}><span className="structure-icon"><GitBranch size={15} /></span><span>{item}</span><Check size={15} className="structure-check" /></div>)}</div> : <p className="subtle-text">No supported data structures detected in this snippet.</p>}</div></> : !analysisError && !working && <div className="empty-state"><div className="empty-icon"><Search size={27} /></div><h3>Ready when you are</h3><p>Write or select an algorithm, then click <strong>Analyze complexity</strong> to see its estimated cost.</p></div>}
                      </> : <>
                        {working === "run" && <div className="notice loading"><LoaderCircle size={18} className="spin" /> Waiting for the Run API…</div>}
                        {runError && <div className="notice error"><CircleAlert size={18} /><div><strong>{runError.includes("not configured") ? "Run API coming soon" : "Run failed"}</strong><span>{runError}</span></div></div>}
                        {execution && <div className="execution"><div className="output-status">Process exited with code <strong>{execution.exitCode ?? "unknown"}</strong></div><div className="output-label">STDOUT</div><pre>{execution.stdout || "(no output)"}</pre>{execution.stderr && <><div className="output-label stderr">STDERR</div><pre>{execution.stderr}</pre></>}</div>}
                        {!execution && !runError && !working && <div className="empty-state"><div className="empty-icon terminal"><Terminal size={27} /></div><h3>Output will appear here</h3><p>Connect your C++ execution API to compile and run code. Input from the editor is sent as <code>source_code</code>.</p></div>}
                      </>
                      }
                    </div>
                    <div className="results-footer"><span className="ai-dot" /> Estimates are heuristic, not formal proofs.</div>
                  </>
                }
              </div>
              <div className="examples-card">
                <div className="examples-head">
                  <div>
                    <div className="section-label">GET STARTED</div>
                    <h3>Explore examples</h3></div><span className="example-count">0{examples.length}</span>
                </div>
                <div className="examples-list">
                  {examples.map((example, index) => <button className={`example-row ${selected === index ? "current" : ""}`} key={example.label} onClick={() => chooseExample(index)}><span className="example-icon"><FileCode2 size={17} /></span><span className="example-copy"><strong>{example.name}</strong><small>{example.description}</small></span><ArrowRight size={15} className="example-arrow" /></button>)}
                </div>
              </div>
              <div className="about-card" id="about-card"><div className="about-icon"><Info size={17} /></div><div><strong>About these estimates</strong><p>Codeforge inspects source patterns. Complex C++ programs may require manual analysis.</p></div></div>
            </aside>
          </div>
          <footer className="footer"><span><Code2 size={15} /> CODEFORGE <span className="footer-divider">/</span> Built for algorithms</span><span>C++17 <span className="footer-divider">·</span> v1.0</span></footer>
        </div>
      </div>
    </div>
  );
}
