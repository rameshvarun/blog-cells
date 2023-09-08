import { LanguageSupport } from "@codemirror/language";

export type OutputLine = {
  type: "log" | "error" | "warn";
  line: string;
};

export abstract class Kernel {
  requestID: number = 0;
  getRequestID() {
    return this.requestID++;
  }

  abstract run(
    code: string,
    onOutput: (line: OutputLine) => void,
    onDone: () => void
  );
  abstract getSyntaxHighlighter(): LanguageSupport;
}
