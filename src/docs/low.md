
**Low Severity Bug Review Prompt**

Here are some common types of low severity bugs to watch for in code reviews:

- Minor style inconsistencies (indentation, spacing, naming)
- Unused imports, variables, or functions
- Insufficient or outdated comments/documentation
- Trivial logic that could be simplified
- Inconsistent error handling for non-critical paths
- Minor performance inefficiencies (e.g., repeated calculations in small scopes)
- Non-blocking linter/warning issues
- Slightly unclear variable or function naming (but still understandable)
- Small missed optimizations (non-critical)
- Code that could be more DRY but does not repeat excessively
- Test cases that could be more thorough for edge situations (but main logic covered)

**Prompt for reviewers**:
> While reviewing, please note any low severity issues such as style inconsistencies, minor inefficiencies, unused code, or improvements in comments or naming. Suggest non-blocking changes that could enhance code quality or maintainability without requiring immediate fixes.

