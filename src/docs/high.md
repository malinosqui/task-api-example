**High Severity Bug Review Prompt**

Be highly vigilant for the following types of high severity bugs during code review—they can result in broken functionality, data loss, major security risks, or system instability:

- Incorrect business logic that produces wrong results
- Unhandled or swallowed errors (especially in async code)
- Missing or incorrect validation of user input
- Race conditions, concurrency bugs, or improper handling of async/await
- Security vulnerabilities (e.g., SQL injection, XSS, unauthorized access)
- Use of deprecated or unsafe APIs/libraries
- Data corruption or loss due to faulty read/write/update logic
- Failure to handle null/undefined or edge cases leading to crashes
- Improper access control (e.g., users can access or modify unauthorized resources)
- Use of `any` type or missing/invalid types that permit unsafe behavior (TypeScript)
- Ignoring promise rejections or not using try/catch with async logic
- Inadequate or incorrect error messages (unclear for users, leaking internal details)
- Dependency on untrusted user input without sanitization
- Missing unit or integration tests for critical code paths

**Prompt for reviewers:**
> Review the code for any defects that could cause critical failures, security breaches, loss of data, or expose the system to attack. If you identify a high severity issue, flag it immediately and request a mandatory fix before approval. Prioritize the safety, integrity, and correctness of the system above all else.

