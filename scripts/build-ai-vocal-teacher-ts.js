const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const builds = [
  {
    source: path.join(projectRoot, 'src/ai-vocal-teacher/immediateFeedback.ts'),
    output: path.join(projectRoot, 'features/ai-vocal-teacher/ai-vocal-teacher-immediate-feedback.js'),
    globals: ['generateImmediateFeedback', 'generateTaskSummary', 'aiTeacherImmediateScore'],
  },
];

function stripTypeBlocks(source) {
  return source.replace(/(?:export\s+)?type\s+\w+\s*=\s*\{[\s\S]*?\};\s*/g, '');
}

function transpile(source, globals) {
  let js = stripTypeBlocks(source);
  js = js.replace(/^export\s+/gm, '');
  js = js.replace(/\n{3,}/g, '\n\n').trim();
  const assignments = globals.map((name) => `window.${name} = ${name};`).join('\n');
  return `// Generated from src/ai-vocal-teacher/*.ts. Do not edit directly.\n${js}\n\n${assignments}\n`;
}

for (const build of builds) {
  const source = fs.readFileSync(build.source, 'utf8');
  const output = transpile(source, build.globals);
  fs.mkdirSync(path.dirname(build.output), { recursive: true });
  fs.writeFileSync(build.output, output, 'utf8');
  console.log(`[ts-build] ${path.relative(projectRoot, build.source)} -> ${path.relative(projectRoot, build.output)}`);
}
