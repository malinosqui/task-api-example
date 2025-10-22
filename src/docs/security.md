**Security Bug Review Prompt**

Security vulnerabilities expose your system, data, and users to risk. Use this checklist to methodically hunt for potential security problems during code review:

- Are all user inputs validated, sanitized, and checked for type/format?
- Is sensitive data (passwords, secrets, tokens, PII) never exposed, logged, or mishandled?
- Are authentication and authorization controls correctly applied to all protected resources?
- Does the code prevent injection attacks (e.g., SQL, NoSQL, command, XSS) by never trusting raw input and using safe APIs?
- Are error messages safe—never revealing internal details, stack traces, or sensitive information?
- Are external dependencies trusted and up to date? Are their types and usage secure?
- Is output properly encoded for the destination context (HTML, JSON, SQL, shell, etc.)?
- Are direct calls to `console.*` replaced with proper logging via a secure logger?
- Are all async errors properly handled with try/catch? Are there no swallowed exceptions?
- Are secrets/configuration loaded securely (never hardcoded)?
- Are rate limits, request body/content type validation, and size checks in place?
- Do file uploads (if any) restrict file type/size and never trust the file name or content?
- Is CORS configured correctly? Are same-origin policies enforced as needed?
- Are permissions checked at every sensitive operation, not just on initial access?
- Does the code avoid insecure defaults and clearly fail closed on denied actions?
- For TypeScript: Is `any` avoided for user data and external inputs? Is `unknown` or strict typing enforced?

**Prompt for reviewers:**
> Review every line of code with a security-first mindset. If you see any unvalidated input, unsafe data handling, missing auth checks, weak error handling, or code that could leak, corrupt, or reveal sensitive data, *flag it immediately*. Require clear evidence that all potential vulnerabilities have been considered and mitigated—or block until they are.

*If in doubt, escalate for senior security review! Never assume security is someone else’s job.*
