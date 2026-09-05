const assert = require('node:assert/strict');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const root = join(__dirname, '..');
const masterPath = join(root, 'assets', 'evos-brand-v2.png');

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

test('the approved EVOS master is a valid 1254 px square PNG', () => {
  const image = readFileSync(masterPath);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), 1254);
  assert.equal(image.readUInt32BE(20), 1254);
  assert.ok(statSync(masterPath).size > 100_000);
});

test('the global brand loader uses the approved master and a safe fallback', () => {
  const loader = readFileSync(join(root, 'evos-brand.js'), 'utf8');
  assert.match(loader, /assets\/evos-brand-v2\.png/);
  assert.match(loader, /makeFallback/);
  assert.doesNotMatch(loader, /assets\/evos-brand\.jpg/);
});

test('every EVOS HTML surface loads the shared brand system', () => {
  const missing = htmlFiles(root).filter(path => {
    const html = readFileSync(path, 'utf8');
    return !html.includes('evos-brand.js') && !html.includes('data-evos-brand');
  });
  assert.deepEqual(missing, []);
});
