import { LanguageSupport } from "@codemirror/language";

export type OutputLine = {
  type: string;
  line: string;
};

export interface Kernel {
  run(code: string, onOutput: (line: OutputLine) => void, onDone: () => void);
  getSyntaxHighlighter(): LanguageSupport;
}
