import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
function discover(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? discover(resolve(dir, e.name)) : /\.spec\.(ts|mjs)$/.test(e.name) ? [resolve(dir, e.name)] : []).sort(); }
const args = process.argv.slice(2);
if (args.some(a => a !== '--run'))
    throw new Error('Argumento no reconocido');
const results = [];
for (const file of discover(resolve(root, 'tests'))) {
    const start = performance.now();
    const r = spawnSync(process.execPath, [...(file.endsWith('.ts') ? ['--import', 'tsx'] : []), file], { cwd: root, encoding: 'utf8', timeout: 60000 });
    process.stdout.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
    results.push({ file: relative(root, file).replaceAll('\\', '/'), status: r.status === 0 ? 'pass' : 'fail', durationMs: Math.round(performance.now() - start), output: r.stdout, error: r.error?.message || r.stderr });
}
mkdirSync(resolve(root, 'test-results'), { recursive: true });
writeFileSync(resolve(root, 'test-results/results.json'), JSON.stringify({ sha: spawnSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).stdout?.trim(), node: process.version, suites: results.length, passed: results.filter(r => r.status === 'pass').length, results }, null, 2));
console.log(results.filter(r => r.status === 'pass').length + '/' + results.length + ' suites PASS');
process.exitCode = results.length === 0 || results.some(r => r.status !== 'pass') ? 1 : 0;
