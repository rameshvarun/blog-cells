// @ts-ignore - Load worker source code.
import WORKER_SRC from "!raw-loader!ts-loader!./worker.ts";
const blob = new Blob([WORKER_SRC], { type: "application/javascript" });

import { javascript } from "@codemirror/lang-javascript";
import { Kernel, OutputLine } from "../kernel";
import { ExecutionRequest, ExecutionResponse } from "./types";

export class JavaScriptKernel implements Kernel {
    worker: Worker = new Worker(URL.createObjectURL(blob));

    requestID: number = 0;
    getRequestID() {
        return this.requestID++;
    }

    run(code: string, onOutput: (line: OutputLine) => void, onDone: () => void) {
        // Generate a unique ID to track this execution request.
        const requestID = this.getRequestID();

        const messageHandler = (e: MessageEvent<ExecutionResponse>) => {
            if (e.data.requestID != requestID) return;

            if (e.data.kind === "run-code-output") {
                onOutput(e.data.output);
            } else if (e.data.kind === "run-code-done") {
                this.worker.removeEventListener("message", messageHandler);
                onDone();
            }
        };

        this.worker.addEventListener("message", messageHandler);

        // Post the code to the worker.
        this.worker.postMessage({
            kind: "run-code",
            code: code,
            requestID: requestID,
        } as ExecutionRequest);
    }

    getSyntaxHighlighter() {
        return javascript();
    }
}