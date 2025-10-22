**Critical Severity Bug Review Prompt**

Critical severity bugs represent the most dangerous failures in software—those that can compromise the continued operation, safety, or trustworthiness of the entire system. These must be identified and fixed *before* any deployment. Bugs in this category often have the potential to:

- Cause total system outages or repeated crashes
- Permit loss, leakage, or irreversible corruption of sensitive data
- Allow full system compromise (e.g., remote code execution, privilege escalation)
- Expose credentials, secrets, or confidential information
- Violate legal or regulatory requirements (GDPR, HIPAA, etc.)
- Enable unrecoverable loss of user funds or assets
- Break authentication, authorization, or auditing controls
- Render core business functionality unavailable for all users
- Seemingly "impossible" states or exploits (e.g., bypassing all validations)

**Prompt for reviewers:**
> Carefully examine the code for bugs that could result in catastrophic failure, regulatory violation, security breach, or system takeover. If you find a critical severity issue, *stop the review process* and demand an immediate fix—no exceptions. Communicate the risk clearly and ensure escalation to the responsible team or leadership. Never allow potentially critical bugs to reach production.

**Remember:** If you are unsure whether an issue is critical, err on the side of caution and escalate for team discussion.

