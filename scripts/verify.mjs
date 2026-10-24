import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const required = ['tests/unit/schema.spec.ts', 'tests/unit/conflict-policy.spec.ts', 'tests/unit/device-helpers.spec.ts', 'tests/integration/sync-queue.spec.ts', 'tests/integration/server-dedup.spec.ts', 'tests/e2e/critical-path.spec.ts', 'docs/test-strategy.md', '.github/workflows/academic-evaluation.yml', 'evidence/individual.md'];
const missing = required.filter(f => !existsSync(resolve(root, f)));
const steps = [];
for (const [name, args] of [['typecheck', ['node_modules/typescript/bin/tsc', '--noEmit']], ['build', ['node_modules/next/dist/bin/next', 'build']], ['tests', ['scripts/test-runner.mjs', '--run']]]) {
    const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 300000, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
    process.stdout.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
    steps.push({ name, status: r.status === 0 ? 'pass' : 'fail', output: r.stdout, error: r.error?.message || r.stderr });
}
const sha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout?.trim();
const dirty = Boolean(spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout?.trim());
const status = !missing.length && steps.every(s => s.status === 'pass') ? 'pass' : 'fail';
mkdirSync(resolve(root, 'test-results'), { recursive: true });
writeFileSync(resolve(root, 'test-results/verification.json'), JSON.stringify({ status, sha, workingTreeModified: dirty, node: process.version, checkedAt: new Date().toISOString(), missing, steps }, null, 2));
console.log('Verification: ' + status);
process.exitCode = status === 'pass' ? 0 : 1;
