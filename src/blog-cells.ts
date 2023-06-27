const SCRIPT_URL = import.meta.url;
const SCRIPT_DIR = SCRIPT_URL.substring(0, SCRIPT_URL.lastIndexOf("/"));
const WORKER_URL = `${SCRIPT_DIR}/blog-cells-worker.js`;

function LoadCSS(href: string) {
  return new Promise<void>((resolve, reject) => {
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    document.head.appendChild(link);
  });
}

function LoadScript(href: string) {
  return new Promise<void>((resolve, reject) => {
    let script = document.createElement("script");
    script.type = "application/javascript";
    script.src = href;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

const domLoaded = new Promise<void>((resolve) => {
  document.addEventListener("DOMContentLoaded", () => resolve());
});

const resources: string[] = [
  // CodeMirror
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.9/codemirror.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.9/theme/monokai.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.9/codemirror.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js",

  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css",

  // React
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.min.js",

  // HTM
  "https://cdnjs.cloudflare.com/ajax/libs/htm/3.1.1/htm.min.js",
];

async function loadResource() {
  for (const resource of resources) {
    if (resource.endsWith(".js")) {
      await LoadScript(resource);
    } else if (resource.endsWith(".css")) {
      await LoadCSS(resource);
    } else {
      throw new Error(`Unknown resource type.`);
    }
  }
}

declare var htm: any;
declare var React: any;
declare var ReactDOM: any;
declare var CodeMirror: any;

Promise.all([domLoaded, loadResource()]).then(() => {
  console.log("TEST");
  const html = htm.bind(React.createElement);

  let worker: Worker = new Worker(WORKER_URL);
  function restartWorker() {
    if (worker) {
      console.log("Terminating existing worker...");
      worker.terminate();
    }
    worker = new Worker(WORKER_URL);
  }
  restartWorker();

  let requestID = 0;
  function getRequestID() {
    return requestID++;
  }

  const editors: any[] = [];

  const events = new EventTarget();

  class Cell extends React.Component {

    codeMirror: any;

    constructor(props) {
      super(props);
      this.state = { kind: "ready", output: [] };

      this.editor = React.createRef();
      this.codeMirror = null;

      this.running = false;
      this.mounted = false;

      if (props.autoRun) {
        this.run(props.code);
      }

      events.addEventListener("worker-restarted", () => {
        this.setState({ kind: "ready", output: [] });
      });
    }

    render() {
      return html`<div className="code-mirror-container">
        <textarea ref=${this.editor} defaultValue=${this.props.code}></textarea>

        ${this.state.output.length > 0
          ? html`<div>
              <pre className="snippet-output">
            ${this.state.output.map(
                  (output, i) =>
                    html`<div className="output-${output.type}" key=${i}>
                      ${output.line}
                    </div>`
                )}
          </pre
              >
            </div>`
          : null}

        <div
          className="run-bar
            run-bar-${this.state.kind === "running" ? "running" : "ready"}"
          onClick=${() => this.run(this.codeMirror.getValue())}
        >
          ${this.state.kind === "ready"
            ? html`<div><i className="fa-solid fa-play"></i> RUN</div>`
            : null}
          ${this.state.kind === "re-runnable"
            ? html`<div>
                <i className="fa-solid fa-arrows-rotate"></i> RE-RUN
              </div>`
            : null}
          ${this.state.kind === "running"
            ? html`<img style=${{
                height: "0.8em",
                margin: "0px",
              }} src="${`${SCRIPT_DIR}/three-dots.svg`}"></img>`
            : null}
        </div>
      </div>`;
    }

    componentDidMount() {
      this.mounted = true;
      this.codeMirror = CodeMirror.fromTextArea(this.editor.current, {
        mode: "javascript",
        theme: "monokai",
        lineNumbers: true,
      });
      editors.push(this.codeMirror);
    }

    async run(code) {
      if (this.running) return;

      console.log("Running snippet...");
      this.running = true;

      if (this.mounted) {
        this.setState({ kind: "running", output: [] });
      } else {
        this.state = { kind: "running", output: [] };
      }

      const requestID = getRequestID();

      worker.postMessage({
        kind: "run-code",
        code: code,
        requestID: requestID,
      });

      const minimumWait = new Promise<void>((resolve, reject) => {
        setTimeout(() => resolve(), 500);
      });

      const messageHandler = async (e) => {
        if (e.data.requestID != requestID) return;
        if (e.data.kind === "run-code-done") {
          // Wait the minimum amount of run-time.
          await minimumWait;

          this.running = false;
          this.setState((state) => {
            state.kind = "re-runnable";
            if (state.output.length === 0)
              state.output.push({ type: "log", line: "Done." });
            return state;
          });
          worker.removeEventListener("message", messageHandler);
        } else if (e.data.kind === "run-code-output") {
          this.setState((state) => {
            state.output.push(e.data.output);
            return state;
          });
        }
      };
      worker.addEventListener("message", messageHandler);
    }
  }

  const scripts = document.querySelectorAll(
    "script[type='text/notebook-cell']"
  ) as NodeListOf<HTMLScriptElement>;
  for (const script of scripts) {
    const code = script.innerHTML.trim();
    const autoRun = script.dataset.autorun === "true";
    const hidden = script.dataset.hidden === "true";

    const editor = document.createElement("div");
    script.after(editor);
    script.remove();

    const root = ReactDOM.createRoot(editor);
    root.render(
      html`<${Cell} code=${code} autoRun=${autoRun} hidden=${hidden} />`
    );
  }
});
