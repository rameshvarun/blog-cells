import { OutputLine } from "../kernel";

export type ExecutionRequest = {
    kind: "run-code";
    code: string;
    requestID: number;
}

export type ExecutionResponse = {
    kind: "run-code-output";
    output: OutputLine;
    requestID: number;
} | {
    kind: "run-code-done";
    requestID: number;
} | {
    kind: "run-code-waiting";
    requestID: number;
};