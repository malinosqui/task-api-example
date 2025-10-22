**🐛 Real Bug Detection Prompt**

During code review, always focus on proactively spotting real (functional) bugs—problems that cause the program to produce incorrect, broken, or unreliable behavior under real conditions.

**Checklist for Bug-Finding in Code Review:**
- Does every function produce the correct and expected outputs for all valid and invalid inputs?
- Are all edge cases, boundary values, and error conditions handled properly?
- Are there any unhandled promise rejections, missing `await`, or forgotten async error handling?
- Could any line throw or crash due to null, undefined, or bad state? Are type assumptions always safe?
- Do all variables and parameters use their intended types and always contain valid data?
- Are all array, object, or string indices valid (never out-of-bounds or undefined)?
- Could race conditions or concurrency issues result in wrong results, duplicated work, or missed updates?
- Are updates, writes, and deletes done in the correct order and fully validated before persisting?
- Is every external call (API, database, service) properly checked for errors and correct responses?
- Could any logic be skipped due to mistaken use of `if`, `return`, or complex boolean conditions?
- Are all important side effects (e.g., sending, saving, cleaning up) guaranteed to actually run?
- Are test cases covering not only the good paths, but also failures, weird inputs, and real-world usage?

**Prompt for reviewers:**
> Review each function, statement, and logic path as if you are trying to break it. Think: *What could go wrong?* Ask yourself, “Would this code behave correctly if I gave it weird, unexpected, or malicious inputs?” If you spot code that could run incorrectly, skip work, throw errors, or produce the wrong data—call it out and request a fix. Don’t ignore “small” mistakes: real bugs often slip in by appearing minor!

*The real goal: No functional bugs reach production! Assume bugs *will* be lurking—find and fix them before users do.*
