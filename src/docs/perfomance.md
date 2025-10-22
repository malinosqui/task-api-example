**Performance Bug Review Prompt**

Performance bugs can severely degrade user experience and system reliability, especially as usage scales. Use this checklist to rigorously identify and prevent performance problems during code review:

- Are queries or data operations efficient, avoiding N+1 or loading excessive data into memory?
- Is unnecessary computation (e.g., repeated calculations, deep cloning, loops over large data sets) avoided?
- Are async operations properly awaited and parallelized where beneficial?
- Is there evidence of blocking code (e.g., synchronous I/O, unbounded CPU loops) in the main thread or request path?
- Are only required data and fields filtered or selected—never sending, storing, or processing more than needed?
- Are caches, pagination, or batching strategies considered for expensive or high-volume operations?
- Is third-party API usage optimized and rate-limited to avoid bottlenecks or failures?
- Are resources (memory, connections, file handles) properly managed and released?
- For frontend: Is UI rendering efficient—avoid unnecessary re-renders, large DOM trees, or excessive event handlers?
- For backend: Are tasks and background jobs designed for concurrency and scalability?
- Are performance-impacting logs (especially in tight loops or critical paths) used sparingly and at appropriate log levels?
- Are any costly operations guarded behind feature flags or used only when necessary?
- Is algorithmic complexity (Big O) appropriate for the data sizes and scenarios expected?
- Are potentially unbounded user inputs validated or limited to prevent resource exhaustion?
- Does error handling avoid excessive retries or resource leaks that could hamper performance?

**Prompt for reviewers:**
> Analyze the code for patterns that could cause slowness, resource exhaustion, or unscalable performance as usage grows. If you notice inefficient queries, unbounded loops/data, excessive memory usage, or missing pagination/caching, *flag them and request optimization* before approval. Always consider the real-world workload and future growth.

*Strive for efficient, scalable, and resilient code that remains performant under load.*
