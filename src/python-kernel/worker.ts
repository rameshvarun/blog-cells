importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js");
declare var loadPyodide;

let onStdout: ((str) => void) | null = null;

// Start loading Pyodide asynchronously.
const loadPython = (async () => {
  let pyodide = await loadPyodide({
    stdout: (msg) => {
      if (msg === "Python initialization complete") return;
      if (onStdout) onStdout(msg);
    },
  });

  // Install micropip by default. Users can install
  // additional packages using `micropip.install()`.
  await pyodide.loadPackage("micropip");

  return pyodide;
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