---
applyTo: "*"
description: "The most comprehensive, practical, and engineer-authored performance optimization instructions for all languages, frameworks, and stacks. Covers frontend, backend, and database best practices with actionable guidance, scenario-based checklists, troubleshooting, and pro tips."
---

# Performance Optimization Best Practices

## General Principles

- **Measure first, optimize second.** Profile and benchmark before optimizing. Use Chrome DevTools, Lighthouse, Datadog, Py-Spy, or language-specific profilers.
- **Optimize for the common case.** Focus on the most frequently executed code paths.
- **Avoid premature optimization.** Write clear code first; optimize when necessary.
- **Minimize resource usage.** Use memory, CPU, network, and disk efficiently.
- **Prefer simplicity.** Simple algorithms and data structures are often faster and easier to optimize.
- **Document performance assumptions.** Comment on performance-critical or non-obvious optimizations.
- **Automate performance testing.** Integrate benchmarks into CI/CD to catch regressions early.
- **Set performance budgets.** Define limits for load time, memory, API latency; enforce with automation.

---

## Frontend Performance

### Rendering and DOM

- Minimize DOM manipulations; batch updates using document fragments
- Use `React.memo`, `useMemo`, `useCallback` to prevent unnecessary re-renders
- Always use stable keys in lists (not array indices for dynamic lists)
- Prefer CSS transitions/animations over JavaScript for GPU-accelerated effects
- Use `requestIdleCallback` to defer non-critical rendering

### Asset Optimization

- Compress images (WebP, AVIF); use SVGs for icons
- Bundle and minify JS/CSS with tree-shaking (Webpack, Rollup, esbuild)
- Set long-lived cache headers for static assets with cache busting
- Lazy load images (`loading="lazy"`) and JS modules (dynamic imports)
- Subset fonts and use `font-display: swap`

### Network Optimization

- Reduce HTTP requests; inline critical CSS
- Enable HTTP/2 or HTTP/3 for multiplexing
- Use Service Workers, IndexedDB, and localStorage for caching
- Serve static assets from a CDN
- Use `defer`/`async` for non-critical scripts
- Use `<link rel="preload">` and `<link rel="prefetch">` for critical resources

### JavaScript Performance

- Offload heavy computation to Web Workers
- Debounce/throttle scroll, resize, and input event handlers
- Clean up event listeners, intervals, and DOM references to prevent memory leaks
- Use Maps/Sets for lookups, TypedArrays for numeric data
- Avoid global variables and unnecessary deep object cloning

### React-Specific

- Use `React.memo`, `useMemo`, `useCallback` judiciously
- Split large components; use code-splitting (`React.lazy`, `Suspense`)
- Avoid anonymous functions in render (creates new references every render)
- Profile with React DevTools Profiler

### Frontend Troubleshooting

- Chrome DevTools Performance tab for slow frames
- Lighthouse for actionable audit suggestions
- WebPageTest for real-world load testing
- Monitor Core Web Vitals (LCP, FID, CLS)

---

## Backend Performance

### Algorithms and Data Structures

- Choose appropriate data structures (hash maps for lookups, arrays for sequential access)
- Avoid O(n^2) or worse; profile nested loops and recursive calls
- Batch-process data to reduce overhead (bulk DB inserts)
- Use streaming APIs for large data sets

### Concurrency and Parallelism

- Use async/await to avoid blocking threads
- Use thread/worker pools to manage concurrency
- Guard against race conditions with locks, semaphores, or atomic operations
- Batch network/database calls to reduce round trips
- Implement backpressure in queues and pipelines

### Caching

- Cache expensive computations with Redis or Memcached
- Use TTL, event-based, or manual cache invalidation (stale cache is worse than no cache)
- Protect against cache stampede with locks or request coalescing
- Don't cache volatile or sensitive data

### API and Network

- Minimize payloads; compress responses (gzip, Brotli)
- Paginate large result sets; use cursors for real-time data
- Rate-limit APIs to prevent abuse
- Use connection pooling for databases and external services
- Prefer HTTP/2, gRPC, or WebSockets for high-throughput communication

### Logging and Monitoring

- Minimize logging in hot paths
- Use structured logging (JSON/key-value) for easier parsing
- Monitor latency, throughput, error rates, resource usage (Prometheus, Grafana, Datadog)
- Set up alerts for performance regressions

### Node.js

- Never use synchronous APIs (`fs.readFileSync`) in production
- Use clustering or worker threads for CPU-bound tasks
- Use streams for large file or network data processing
- Profile with `clinic.js`, `node --inspect`, or Chrome DevTools

### Python

- Use built-in structures (`dict`, `set`, `deque`); profile with `cProfile` or `Py-Spy`
- Use `multiprocessing` or `asyncio` for parallelism
- Use `lru_cache` for memoization

### Backend Troubleshooting

- Use flame graphs to visualize CPU usage
- Use distributed tracing (OpenTelemetry, Jaeger) across services
- Use heap dumps and memory profilers to find leaks
- Log slow queries and API calls

---

## Database Performance

### Query Optimization

- Index columns frequently queried, filtered, or joined; drop unused indexes
- Select only needed columns (avoid `SELECT *`)
- Use parameterized queries for injection prevention and plan caching
- Analyze execution plans with `EXPLAIN`
- Avoid N+1 queries; use joins or batch queries
- Use `LIMIT`/`OFFSET` or cursors for large result sets

### Schema Design

- Normalize to reduce redundancy; denormalize for read-heavy workloads when needed
- Use efficient data types with appropriate constraints
- Partition large tables; regularly archive old data
- Use foreign keys for integrity (aware of write-perf trade-offs)

### Transactions

- Keep transactions short to reduce lock contention
- Use the lowest isolation level that meets consistency needs

### Caching and Replication

- Use read replicas for read-heavy workloads; monitor replication lag
- Cache frequently accessed query results (Redis, Memcached)
- Use sharding to distribute data across servers

### NoSQL

- Model data for access patterns, not normalization
- Distribute writes/reads evenly to avoid hot partitions
- Watch for unbounded arrays or documents
- Understand eventual vs strong consistency trade-offs

### Database Troubleshooting

- Use slow query logs and `EXPLAIN` to identify bottlenecks
- Monitor cache hit/miss ratios
- Use database-specific tools (pg_stat_statements, MySQL Performance Schema)

---

## Code Review Checklist for Performance

- [ ] No algorithmic inefficiencies (O(n^2) or worse)?
- [ ] Data structures appropriate for their use?
- [ ] No unnecessary computations or repeated work?
- [ ] Caching used where appropriate with correct invalidation?
- [ ] Database queries optimized, indexed, no N+1?
- [ ] Large payloads paginated, streamed, or chunked?
- [ ] No memory leaks or unbounded resource usage?
- [ ] Network requests minimized, batched, retried on failure?
- [ ] Assets optimized, compressed, served efficiently?
- [ ] No blocking operations in hot paths?
- [ ] Logging in hot paths minimized and structured?
- [ ] Performance-critical paths documented and tested?
- [ ] Automated benchmarks for performance-sensitive code?
- [ ] Alerts configured for performance regressions?

---

## Advanced Topics

### Profiling and Benchmarking

- Use language-specific profilers to identify bottlenecks
- Write microbenchmarks for critical paths (`benchmark.js`, `pytest-benchmark`, JMH)
- Integrate continuous performance tests into CI/CD (k6, Gatling, Locust)

### Memory Management

- Release resources (files, sockets, DB connections) promptly
- Use object pooling for frequently created/destroyed objects
- Monitor heap usage and GC; tune settings for workload
- Use leak detection tools (Valgrind, LeakCanary, Chrome DevTools)

### Scalability

- Design stateless services; use sharding/partitioning and load balancers
- Use cloud auto-scaling with sensible thresholds
- Use idempotent operations, retries, and circuit breakers in distributed systems

### Cloud and Serverless

- Minimize cold starts by keeping dependencies small and functions warm
- Tune memory/CPU allocation for serverless functions
- Use managed caching, queues, and databases for scalability
- Monitor and optimize cloud cost as a performance metric

---

## Practical Examples

### Debouncing User Input (JavaScript)

```javascript
// BAD: API call on every keystroke
input.addEventListener("input", (e) => {
  fetch(`/search?q=${e.target.value}`);
});

// GOOD: Debounce API calls
let timeout;
input.addEventListener("input", (e) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    fetch(`/search?q=${e.target.value}`);
  }, 300);
});
```

### Efficient SQL Query

```sql
-- BAD: Selects all columns
SELECT * FROM users WHERE email = 'user@example.com';

-- GOOD: Select only needed columns
SELECT id, name FROM users WHERE email = 'user@example.com';
```

### Caching in Python

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_function(x):
    ...
```

### Lazy Loading Images

```html
<!-- BAD -->
<img src="large-image.jpg" />

<!-- GOOD -->
<img src="large-image.jpg" loading="lazy" />
```

### Async I/O in Node.js

```javascript
// BAD: Blocking
const data = fs.readFileSync("file.txt");

// GOOD: Non-blocking
fs.readFile("file.txt", (err, data) => {
  if (err) throw err;
  // process data
});
```

---

## References

- [Google Web Fundamentals: Performance](https://web.dev/performance/)
- [MDN Web Docs: Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Node.js Profiling Guide](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [OpenTelemetry](https://opentelemetry.io/)
- [k6 Load Testing](https://k6.io/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
