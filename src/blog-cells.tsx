import { history, defaultKeymap, historyKeymap } from "@codemirror/commands";
import { EditorView, lineNumbers, keymap } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";

import * as React from "react";
import * as ReactDOM from "react-dom/client";

// Figure out the parent URL of this script.
const SCRIPT_URL = (document.currentScript as HTMLScriptElement).src;
const SCRIPT_DIR = SCRIPT_URL.substring(0, SCRIPT_URL.lastIndexOf("/"));

const editors: any[] = [];
const events = new EventTarget();

import { JavaScriptKernel } from "./javascript-kernel";
import { PythonKernel } from "./python-kernel";
import { Kernel } from "./kernel";

export { JavaScriptKernel, PythonKernel, Kernel };

// Register kernels by name and lazily initialize them.
class KernelFactory {
  initializers: Map<string, () => Kernel> = new Map();
  kernels: Map<string, Kernel> = new Map();

  register(name: string, initializer: () => Kernel) {
    this.initializers.set(name, initializer);
  }

  get(name: string): Kernel {
    if (this.kernels.has(name)) {
      return this.kernels.get(name)!;
    }

    if (this.initializers.has(name)) {
      const kernel = this.initializers.get(name)!();
      this.kernels.set(name, kernel);
      return kernel;
    }

    throw new Error(`Unknown kernel: ${name}`);
  }
}

const kernelFactory = new KernelFactory();
kernelFactory.register("javascript", () => new JavaScriptKernel());
kernelFactory.register("python", () => new PythonKernel());

export const registerKernel = kernelFactory.register.bind(kernelFactory);
export const getKernel = kernelFactory.get.bind(kernelFactory);

class Cell extends React.Component<
  {
    code: string;
    autoRun: boolean;
    hideable: boolean;
    kernel: Kernel;
    onMount?: () => void;
  },
  {
    kind: "ready" | "running" | "re-runnable";
    output: { type: string; line: string }[];
    hidden: boolean;
  }
> {
  codeMirror: EditorView | null = null;
  editor: React.RefObject<HTMLDivElement> = React.createRef();
  outputRef: React.RefObject<HTMLPreElement> = React.createRef();

  running: boolean;
  mounted: boolean;

  constructor(props) {
    super(props);
    this.state = {
      kind: "ready",
      output: [],
      hidden: props.hideable === true,
    };

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
    return (
      <div className="cell-editor">
        {this.props.hideable ? (
          <div
            className="cell-header"
            onClick={() => {
              this.setState({ hidden: !this.state.hidden });
            }}
          >
            <div>{this.state.hidden ? "SHOW HIDDEN CELL" : "HIDE CELL"}</div>
          </div>
        ) : null}

        <div
          style={{
            height: this.state.hidden ? "0px" : "auto",
            overflowY: "hidden",
            opacity: this.state.hidden ? "0" : "1",
            transition: "opacity 0.2s ease 0s",
          }}
        >
          <div ref={this.editor}></div>
          {this.state.output.length > 0 ? (
            <div>
              <pre ref={this.outputRef} className="snippet-output">
                {this.state.output.map((output, i) => (
                  <div className={"output-" + output.type} key={i}>
                    {output.line}
                  </div>
                ))}
              </pre>
            </div>
          ) : null}

          <div
            className={
              "run-bar run-bar-" +
              (this.state.kind === "running" ? "running" : "ready")
            }
            onClick={() => this.run(this.codeMirror!.state.doc.toString())}
          >
            {this.state.kind === "ready" ? (
              <div>
                <i className="fa-solid fa-play"></i> RUN
              </div>
            ) : null}
            {this.state.kind === "re-runnable" ? (
              <div>
                <i className="fa-solid fa-arrows-rotate"></i> RE-RUN
              </div>
            ) : null}
            {this.state.kind === "running" ? (
              <img
                style={{
                  height: "0.8em",
                  margin: "0px",
                }}
                src={`${SCRIPT_DIR}/three-dots.svg`}
              ></img>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.mounted = true;

    const extensions = [
      history(),
      lineNumbers(),
      oneDark,
      keymap.of([...defaultKeymap, ...historyKeymap]),
    ];

    const syntaxHighlighter = this.props.kernel.getSyntaxHighlighter();
    if (syntaxHighlighter) {
      extensions.push(syntaxHighlighter);
    }

    this.codeMirror = new EditorView({
      parent: this.editor.current!,
      doc: this.props.code,
      extensions: extensions,
    });
    editors.push(this.codeMirror);

    if (this.props.onMount) {
      this.props.onMount();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.output.length > prevState.output.length) {
      this.outputRef.current!.scrollTop = this.outputRef.current!.scrollHeight;
    }
  }

  async run(code) {
    if (this.running) return;

    console.log("Running snippet...");
    this.running = true;

    if (this.mounted) {
      this.setState({ kind: "running", output: [] });
    } else {
      // @ts-ignore
      this.state.kind = "running";
      // @ts-ignore
      this.state.output = [];
    }

    const minimumWait = new Promise<void>((resolve, reject) => {
      setTimeout(() => resolve(), 500);
    });

    // Run the code.
    await this.props.kernel.run(code, (line) => {
      this.setState((state) => {
        return {
          output: [...state.output, line],
        };
      });
    });

    // Wait the minimum amount of run-time.
    await minimumWait;

    // Mark as not running.
    this.running = false;

    this.setState({ kind: "re-runnable" });
    if (this.state.output.length === 0) {
      this.setState({ output: [{ type: "log", line: "Done." }] });
    }
  }
}

const domLoaded = new Promise<void>((resolve) => {
  document.addEventListener("DOMContentLoaded", () => resolve());
});

domLoaded.then(() => {
  // Transform all script / pre tags into cells.
  const scripts = document.querySelectorAll(
    "script[type='text/notebook-cell'], pre.notebook-cell"
  ) as NodeListOf<HTMLScriptElement>;

  for (const script of scripts) {
    const code = script.textContent?.trim() || "";

    const kernelName = script.dataset.kernel || "javascript";
    const kernel = kernelFactory.get(kernelName);

    const autoRun = script.dataset.autorun === "true";
    const hidden = script.dataset.hidden === "true";

    const editor = document.createElement("div");
    script.after(editor);

    const root = ReactDOM.createRoot(editor);
    root.render(
      <Cell
        code={code}
        autoRun={autoRun}
        hideable={hidden}
        kernel={kernel}
        onMount={() => {
          // Remove the script tag once the cell succesfully mounts.
          script.remove();
        }}
      />
    );
  }
});
