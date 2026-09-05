const baseUrl = process.env.LOAD_BASE_URL ?? 'http://127.0.0.1:3001';
const total = Number(process.env.LOAD_REQUESTS ?? 5000);
const concurrency = Number(process.env.LOAD_CONCURRENCY ?? 50);
const paths = ['/health', '/v1/search?q=kitchen', '/v1/problems', '/v1/projects', '/v1/bounties'];
const latencies = [];
let cursor = 0;
let failures = 0;
async function runner() {
  while (true) {
    const index = cursor++;
    if (index >= total) return;
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl}${paths[index % paths.length]}`);
      if (!response.ok) failures++;
      await response.arrayBuffer();
    } catch {
      failures++;
    }
    latencies.push(performance.now() - started);
  }
}
const started = performance.now();
await Promise.all(Array.from({ length: concurrency }, () => runner()));
latencies.sort((a, b) => a - b);
const percentile = (value) =>
  latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * value))] ?? 0;
const result = {
  baseUrl,
  total,
  concurrency,
  failures,
  errorRate: failures / total,
  durationMs: Math.round(performance.now() - started),
  requestsPerSecond: Number((total / ((performance.now() - started) / 1000)).toFixed(1)),
  p50Ms: Number(percentile(0.5).toFixed(1)),
  p95Ms: Number(percentile(0.95).toFixed(1)),
  p99Ms: Number(percentile(0.99).toFixed(1)),
};
console.log(JSON.stringify(result, null, 2));
if (failures) process.exitCode = 1;
