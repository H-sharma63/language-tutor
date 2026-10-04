const nodeVersion = parseInt(process.version.slice(1), 10);
if (nodeVersion < 18) {
  console.error(
    `\n  language-tutor requires Node.js 18 or higher.\n  You are using Node.js ${process.version}.\n  Please upgrade: https://nodejs.org\n`
  );
  process.exit(1);
}

// Check if stdin is a TTY (required for Ink raw mode)
if (!process.stdin.isTTY) {
  console.error(
    `\n  language-tutor requires an interactive terminal (TTY).\n  Please run it directly in your terminal, not via pipe or redirect.\n`
  );
  process.exit(1);
}

import { createRequire } from "module";
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { App } from "./app.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("language-tutor")
  .description("Local-first AI language tutor - practice any language with privacy")
  .version(pkg.version)
  .option("-l, --lang <code>", "start with specific language (es, fr, de, etc.)")
  .option("-c, --conversation <id>", "resume specific conversation")
  .option("--no-stream", "disable streaming responses")
  .parse(process.argv);

const opts = program.opts();

render(React.createElement(App, {
  initialLanguage: opts.lang,
  initialConversation: opts.conversation ? parseInt(opts.conversation, 10) : undefined,
  disableStream: opts.stream === false,
}));