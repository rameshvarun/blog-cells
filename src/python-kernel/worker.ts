importScripts("https://cdn.jsdelivr.net/npm/pyodide@0.23.2/pyodide.min.js");
declare var loadPyodide;

let onStdout: ((str) => void) | null = null;

// Start loading Pyodide asynchronously.
const loadPython = (async () => {
  return await loadPyodide({
    stdout: (msg) => {
      if (msg === "Python initialization complete") return;
      if (onStdout) onStdout(msg);
    },
  });
})();

self.onmessage = async (e: MessageEvent) => {
  console.log("Worker received message: %o", e);
  const requestID = e.data.requestID;

  if (e.data.kind === "run-code") {
    // Register stdout callback.
    onStdout = (msg) => {
      self.postMessage({
        kind: "run-code-output",
        requestID: requestID,
        output: {type: "log", line: msg},
      });
    };

    try {
      // Wait for Pyodide to load.
      const pyodide = await loadPython;

      // Run code in a new namespace.
      pyodide.runPython(e.data.code);
    } catch (error) {
      self.postMessage({
        kind: "run-code-output",
        requestID: requestID,
        output: {type: "error", line: error.toString()},
      });
    } finally {
      // Unregister stdout callback.
      onStdout = null;

      self.postMessage({
        kind: "run-code-done",
        requestID: requestID,
      });
    }
  }
};