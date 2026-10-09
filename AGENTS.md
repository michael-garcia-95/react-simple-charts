# Project rules

- Follow the approved architecture in docs/ARCHITECTURE.md.
- Keep tasks independently reviewable and stop at the approved task boundary.
- Avoid unnecessary dependencies; explain additions and their purpose.
- Run and report relevant tests, exact commands, outcomes, and blocked checks.
- Explain how implemented functionality works and how the pieces interact.
- Explain technical approaches and why they were chosen.
- Identify tradeoffs and alternatives considered.
- Do not begin unapproved tasks.
- Preserve existing work and Git history. Do not overwrite unrelated changes.
- Keep React and React DOM as external peer dependencies, with ESM-only root named exports.
- Keep mathematical calculations pure and separate from React renderers.
- Preserve the client boundary in distributed component entry points.
- Do not publish, deploy, create release tags, or push to the default branch without approval.
- Keep the package private until publication is approved. Do not invent a copyright holder.
