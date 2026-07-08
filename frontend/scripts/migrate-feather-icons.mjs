import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = 'src';
const IMPORT_LINE = "import ShellIcon from '../components/shell/ShellIcon';";
const IMPORT_LINE_DEEP = (depth) =>
  `import ShellIcon from '${'../'.repeat(depth)}components/shell/ShellIcon';`;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!name.includes('node_modules')) walk(p, files);
    } else if (name.endsWith('.jsx') || name.endsWith('.js')) {
      files.push(p);
    }
  }
  return files;
}

function depthFromSrc(file) {
  const rel = file.replace(/\\/g, '/').split('src/')[1];
  const parts = rel.split('/');
  parts.pop();
  return parts.length;
}

function transform(content, file) {
  let next = content;
  const before = next;

  // Static feather icons
  next = next.replace(
    /<i\s+data-feather="([^"]+)"\s+className="([^"]*)"\s*><\/i>/g,
    '<ShellIcon name="$1" className="$2" />'
  );
  next = next.replace(
    /<i\s+data-feather="([^"]+)"\s*><\/i>/g,
    '<ShellIcon name="$1" />'
  );
  next = next.replace(
    /<i\s+data-feather="([^"]+)"\s+className='([^']*)'\s*><\/i>/g,
    "<ShellIcon name=\"$1\" className='$2' />"
  );

  if (next === before) return content;

  if (!next.includes('ShellIcon')) return content;

  const depth = depthFromSrc(file);
  const importPath = depthFromSrc(file) === 0
    ? "import ShellIcon from './components/shell/ShellIcon';"
    : `import ShellIcon from '${'../'.repeat(depth)}components/shell/ShellIcon';`;

  if (!next.includes("from '../components/shell/ShellIcon'") &&
      !next.includes('from "./components/shell/ShellIcon"') &&
      !next.includes('components/shell/ShellIcon')) {
    next = next.replace(/^(import .+\n)/, `$1${importPath}\n`);
    if (!next.includes('ShellIcon')) {
      next = `${importPath}\n${next}`;
    }
  }

  return next;
}

const files = walk(ROOT);
let changed = 0;
for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  if (!raw.includes('data-feather')) continue;
  const out = transform(raw, file);
  if (out !== raw) {
    writeFileSync(file, out, 'utf8');
    changed++;
    console.log('updated:', file);
  }
}
console.log('done, files changed:', changed);
