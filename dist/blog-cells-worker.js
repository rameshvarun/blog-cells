globalThis.cellConsole = {};
cellConsole.__proto__ = console;
let EXECUTION_ID = 0;
function generateExecutionID() {
    return EXECUTION_ID++;
}
importScripts("https://unpkg.com/@babel/standalone/babel.min.js");
/** Format an argument for printing to the output console. */
function formatArg(arg) {
    try {
        if (arg === undefined)
            return "undefined";
        else if (arg === null)
            return "null";
        else if (Array.isArray(arg)) {
            return "[" + arg.map(formatArg).join(", ") + "]";
        }
        else if (typeof arg === "string") {
            return `"${arg}"`;
        }
        else if (typeof arg === "object") {
            if (arg.toString === {}.toString) {
                return JSON.stringify(arg);
            }
            else {
                return arg.toString();
            }
        }
        else {
            return String(arg);
        }
    }
    catch (e) {
        return "<FORMAT-ERROR>";
    }
}
function formatArgs(args) {
    return args
        .map((arg) => {
        if (typeof arg === "string")
            return arg;
        else
            return formatArg(arg);
    })
        .join(" ");
}
class Executor {
    constructor() {
        this.ready = Promise.resolve();
        // The current module containing all the exported
        // values of the cells.
        this.module = {};
        globalThis.module = this.module;
        Babel.registerPlugin("prefixer", ({ types }) => {
            return {
                visitor: {
                    ReferencedIdentifier: (path, state) => {
                        // Skip if this varialbe has been bound.
                        const name = path.node.name;
                        if (path.scope.hasBinding(name))
                            return;
                        // Skip if this variable is not defined on the module.
                        if (!(name in this.module))
                            return;
                        // Replace the identifier with a lookup.
                        path.replaceWith(types.memberExpression(types.identifier("$"), types.identifier(name), false));
                    },
                },
            };
        });
    }
    run(code, output = (type, line) => { }) {
        const done = this.ready
            .then(async () => {
            Object.assign(cellConsole, {
                log: (...args) => {
                    output("log", formatArgs(args));
                },
                info: (...args) => {
                    output("log", formatArgs(args));
                },
                error: (...args) => {
                    output("error", formatArgs(args));
                },
                warn: (...args) => {
                    output("warn", formatArgs(args));
                },
                assert: (condition, ...args) => {
                    if (!condition) {
                        const message = args.length > 0
                            ? "Assertion Failed: " + formatArgs(args)
                            : "Assertion Failed";
                        output("error", message);
                    }
                },
            });
            const transpiled = Babel.transform(code, {
                plugins: ["prefixer"],
            });
            const module = `// ExecutionID: ${generateExecutionID()};
const $ = globalThis.module;
const console = globalThis.cellConsole;
${transpiled.code}`;
            console.log(module);
            const dataURL = "data:text/javascript;base64," + btoa(module);
            const exports = await import(dataURL);
            // Write exports onto the module object.
            Object.assign(this.module, exports);
            for (const prop of Object.getOwnPropertyNames(cellConsole)) {
                delete cellConsole[prop];
            }
        })
            .catch((error) => {
            output("error", error.toString());
        });
        this.ready = done;
        return done;
    }
}
const executor = new Executor();
self.onmessage = async (e) => {
    console.log("Worker received message: %o", e);
    const requestID = e.data.requestID;
    if (e.data.kind === "run-code") {
        self.postMessage({
            kind: "run-code-waiting",
            requestID: requestID,
        });
        await executor.run(e.data.code, (type, output) => {
            self.postMessage({
                kind: "run-code-output",
                requestID: requestID,
                output: {
                    type: type,
                    line: output,
                },
            });
        });
        self.postMessage({
            kind: "run-code-done",
            requestID: requestID,
        });
    }
};
//# sourceMappingURL=blog-cells-worker.js.map