importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js");
declare var loadPyodide;

// Start loading Pyodide immediately.
const loadPython = (async () => {
  let pyodide = await loadPyodide();

  // Install micropip by default. Users can install
  // additional packages using `micropip.install()`.
  await pyodide.loadPackage("micropip");

  return pyodide;
})();

class PythonExecutor {
  ready: Promise<void>;

  constructor() {
    this.ready = Promise.resolve();
  }

  run(
    code,
    output: (logType: string, logLine: string) => void = (type, line) => {}
  ) {
    const done = this.ready
      .then(async () => {
        const pyodide = await loadPython;
        pyodide.setStdout({
          isatty: false,
          batched: (line: string) => {
            output("log", line);
          }
        });
        await pyodide.runPythonAsync(code);
        pyodide.setStdout({});
      })
      .catch((error) => {
        output("error", error.toString());
      });
    this.ready = done;
    return done;
  }
}

const pyExecutor = new PythonExecutor();

self.onmessage = async (e: MessageEvent) => {
  console.log("Worker received message: %o", e);
  const requestID = e.data.requestID;

  if (e.data.kind === "run-code") {
    await pyExecutor.run(e.data.code, (type, output) => {
      self.postMessage({
        kind: "run-code-output",
        requestID: requestID,
        output: {type: type, line: output},
      });
    });

    self.postMessage({
      kind: "run-code-done",
      requestID: requestID,
    });
  }
};