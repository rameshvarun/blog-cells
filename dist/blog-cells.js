/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./node_modules/raw-loader/dist/cjs.js!./node_modules/ts-loader/index.js!./src/blog-cells-worker.ts
/* harmony default export */ const blog_cells_worker = ("globalThis.cellConsole = {};\ncellConsole.__proto__ = console;\nlet EXECUTION_ID = 0;\nfunction generateExecutionID() {\n    return EXECUTION_ID++;\n}\n/** Format an argument for printing to the output console. */\nfunction formatArg(arg) {\n    try {\n        if (arg === undefined)\n            return \"undefined\";\n        else if (arg === null)\n            return \"null\";\n        else if (Array.isArray(arg)) {\n            return \"[\" + arg.map(formatArg).join(\", \") + \"]\";\n        }\n        else if (typeof arg === \"string\") {\n            return `\"${arg}\"`;\n        }\n        else if (typeof arg === \"object\") {\n            if (arg.toString === {}.toString) {\n                return JSON.stringify(arg);\n            }\n            else {\n                return arg.toString();\n            }\n        }\n        else {\n            return String(arg);\n        }\n    }\n    catch (e) {\n        return \"<FORMAT-ERROR>\";\n    }\n}\nfunction formatArgs(args) {\n    return args\n        .map((arg) => {\n        if (typeof arg === \"string\")\n            return arg;\n        else\n            return formatArg(arg);\n    })\n        .join(\" \");\n}\nclass Executor {\n    constructor() {\n        this.ready = Promise.resolve();\n        // The current module containing all the exported\n        // values of the cells.\n        this.module = {};\n        globalThis.module = this.module;\n    }\n    run(code, output = (type, line) => { }) {\n        const done = this.ready\n            .then(async () => {\n            Object.assign(cellConsole, {\n                log: (...args) => {\n                    output(\"log\", formatArgs(args));\n                },\n                info: (...args) => {\n                    output(\"log\", formatArgs(args));\n                },\n                error: (...args) => {\n                    output(\"error\", formatArgs(args));\n                },\n                warn: (...args) => {\n                    output(\"warn\", formatArgs(args));\n                },\n                assert: (condition, ...args) => {\n                    if (!condition) {\n                        const message = args.length > 0\n                            ? \"Assertion Failed: \" + formatArgs(args)\n                            : \"Assertion Failed\";\n                        output(\"error\", message);\n                    }\n                },\n            });\n            const module = `// ExecutionID: ${generateExecutionID()};\nconst $ = globalThis.module;\nconst console = globalThis.cellConsole;\n${code}`;\n            console.log(module);\n            const dataURL = \"data:text/javascript;base64,\" + btoa(module);\n            const exports = await import(dataURL);\n            // Write exports onto the module object.\n            Object.assign(this.module, exports);\n            for (const prop of Object.getOwnPropertyNames(cellConsole)) {\n                delete cellConsole[prop];\n            }\n        })\n            .catch((error) => {\n            output(\"error\", error.toString());\n        });\n        this.ready = done;\n        return done;\n    }\n}\nconst executor = new Executor();\nself.onmessage = async (e) => {\n    console.log(\"Worker received message: %o\", e);\n    const requestID = e.data.requestID;\n    if (e.data.kind === \"run-code\") {\n        self.postMessage({\n            kind: \"run-code-waiting\",\n            requestID: requestID,\n        });\n        await executor.run(e.data.code, (type, output) => {\n            self.postMessage({\n                kind: \"run-code-output\",\n                requestID: requestID,\n                output: {\n                    type: type,\n                    line: output,\n                },\n            });\n        });\n        self.postMessage({\n            kind: \"run-code-done\",\n            requestID: requestID,\n        });\n    }\n};\n");
;// CONCATENATED MODULE: ./src/blog-cells.tsx
const SCRIPT_URL = import.meta.url;
const SCRIPT_DIR = SCRIPT_URL.substring(0, SCRIPT_URL.lastIndexOf("/"));
// @ts-ignore

function LoadCSS(href) {
    return new Promise((resolve, reject) => {
        let link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = () => resolve();
        document.head.appendChild(link);
    });
}
function LoadScript(href) {
    return new Promise((resolve, reject) => {
        let script = document.createElement("script");
        script.type = "application/javascript";
        script.src = href;
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
}
const domLoaded = new Promise((resolve) => {
    document.addEventListener("DOMContentLoaded", () => resolve());
});
const resources = [
    // CodeMirror
    "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.9/codemirror.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.9/theme/monokai.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.9/codemirror.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js",
    // Font Awesome
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css",
    // React
    "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.min.js",
];
async function loadResource() {
    for (const resource of resources) {
        if (resource.endsWith(".js")) {
            await LoadScript(resource);
        }
        else if (resource.endsWith(".css")) {
            await LoadCSS(resource);
        }
        else {
            throw new Error(`Unknown resource type.`);
        }
    }
}
Promise.all([domLoaded, loadResource()]).then(() => {
    const blob = new Blob([blog_cells_worker], { type: 'application/javascript' });
    let worker = new Worker(URL.createObjectURL(blob));
    function restartWorker() {
        if (worker) {
            console.log("Terminating existing worker...");
            worker.terminate();
        }
        worker = new Worker(URL.createObjectURL(blob));
    }
    let requestID = 0;
    function getRequestID() {
        return requestID++;
    }
    const editors = [];
    const events = new EventTarget();
    class Cell extends React.Component {
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
            return (React.createElement("div", { className: "code-mirror-container" },
                React.createElement("textarea", { ref: this.editor, defaultValue: this.props.code }),
                this.state.output.length > 0 ? (React.createElement("div", null,
                    React.createElement("pre", { className: "snippet-output" }, this.state.output.map((output, i) => (React.createElement("div", { className: "output-${output.type}", key: i }, output.line)))))) : null,
                React.createElement("div", { className: "run-bar run-bar-" +
                        (this.state.kind === "running" ? "running" : "ready"), onClick: () => this.run(this.codeMirror.getValue()) },
                    this.state.kind === "ready" ? (React.createElement("div", null,
                        React.createElement("i", { className: "fa-solid fa-play" }),
                        " RUN")) : null,
                    this.state.kind === "re-runnable" ? (React.createElement("div", null,
                        React.createElement("i", { className: "fa-solid fa-arrows-rotate" }),
                        " RE-RUN")) : null,
                    this.state.kind === "running" ? (React.createElement("img", { style: {
                            height: "0.8em",
                            margin: "0px",
                        }, src: `${SCRIPT_DIR}/three-dots.svg` })) : null)));
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
            if (this.running)
                return;
            console.log("Running snippet...");
            this.running = true;
            if (this.mounted) {
                this.setState({ kind: "running", output: [] });
            }
            else {
                this.state = { kind: "running", output: [] };
            }
            const requestID = getRequestID();
            worker.postMessage({
                kind: "run-code",
                code: code,
                requestID: requestID,
            });
            const minimumWait = new Promise((resolve, reject) => {
                setTimeout(() => resolve(), 500);
            });
            const messageHandler = async (e) => {
                if (e.data.requestID != requestID)
                    return;
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
                }
                else if (e.data.kind === "run-code-output") {
                    this.setState((state) => {
                        state.output.push(e.data.output);
                        return state;
                    });
                }
            };
            worker.addEventListener("message", messageHandler);
        }
    }
    const scripts = document.querySelectorAll("script[type='text/notebook-cell'], pre.notebook-cell");
    for (const script of scripts) {
        const code = script.textContent?.trim() || "";
        const autoRun = script.dataset.autorun === "true";
        const hidden = script.dataset.hidden === "true";
        const editor = document.createElement("div");
        script.after(editor);
        script.remove();
        const root = ReactDOM.createRoot(editor);
        root.render(React.createElement(Cell, { code: code, autoRun: autoRun, hidden: hidden }));
    }
});

/******/ })()
;
//# sourceMappingURL=blog-cells.js.map