# CODEFORGE frontend

A small React + JavaScript app for the CODEFORGE complexity analyzer. It keeps the C++ editor, syntax highlighting, undo/redo, starter examples, analysis results, standard input, and the Run button for a future execution endpoint.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- CODEFORGE C++ backend on `http://127.0.0.1:18080` for analysis

## Run locally

Open a terminal in this `frontend` folder:

```sh
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Start the C++ backend separately before clicking **Analyze complexity**.

To build static files for deployment:

```sh
npm run build
```

The generated site is in `dist/`. There is no Next.js server to run.

## Connect the APIs

In development, Vite proxies these browser requests to the C++ backend, so local development does not require CORS changes:

| Browser request | Backend endpoint | Status |
| --- | --- | --- |
| `POST /api/analyze` | `POST /analysis-complexity` | Already available |
| `POST /api/run` | `POST /run` by default | Add this yourself |

The analyzer receives:

```json
{ "source_code": "int algorithm(int n) { return n; }" }
```

and should return:

```json
{
  "timeComplexity": "O(1)",
  "spaceComplexity": "O(1)",
  "detectedStructures": []
}
```

The analyzed function should be named `algorithm`. Other functions can be helpers. Estimates are heuristic.

### Enable Run later

After implementing your C++ execution endpoint, create `.env.local`:

```env
BACKEND_URL=http://127.0.0.1:18080
VITE_RUN_API_PATH=/run
```

Restart `npm run dev` after changing environment variables. The Run button will send:

```json
{
  "source_code": "#include <iostream>\nint main() { std::cout << 42; }",
  "stdin": ""
}
```

Your endpoint should respond with:

```json
{
  "stdout": "42",
  "stderr": "",
  "exitCode": 0
}
```

Use `exitCode: null` when the program did not exit normally. Until `VITE_RUN_API_PATH` is set, clicking Run explains that the endpoint is not configured. Compile and run untrusted code only in an isolated environment with time and memory limits; this frontend does not run C++ in the browser.

### Production deployment

`vite build` outputs static files. Vite's development proxy does not exist in production. Either configure your web server to proxy `/api/analyze` to `/analysis-complexity` and `/api/run` to your run endpoint, or build with `VITE_API_BASE_URL` set to the public backend origin:

```env
VITE_API_BASE_URL=https://your-api.example.com
VITE_RUN_API_PATH=/run
```

For a separate backend origin, allow the frontend's origin with CORS on the C++ backend. `VITE_` variables are embedded into the built JavaScript, so do not put secrets in them.

## Files

- `src/Studio.jsx`: editor, undo/redo, analysis and Run actions, result panels
- `src/styles.css`: existing visual design
- `vite.config.js`: local API proxy
- `index.html` and `src/main.jsx`: React entry point

Edits are stored in the browser's local storage. Upload accepts C++ source files under 200 KB. The standard input field is sent only to the Run API.
