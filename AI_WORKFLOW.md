# AI Development Workflow Reference

## Tool Responsibilities

| Tool | Role | When to Use |
|------|------|-------------|
| **GSD** | Planning & Context | Requirements, roadmap, phases, verification, project state |
| **Antigravity** | Development | Interactive coding, file ops, terminal, browser, MCP, subagents |
| **Roo Code** | Optional secondary | VS Code coding only — use when working directly in VS Code |
| **Ralph** | NOT configured | Not compatible with Antigravity runtime |

## Recommended Workflow

```
1. DISCOVER
   Read existing code, docs, GSD state
   ↓
2. GSD ONBOARD / CONTEXT
   /gsd-onboard  (for existing projects)
   /gsd-new-project  (for new projects)
   ↓
3. GSD DISCUSS
   /gsd-discuss-phase  (clarify requirements)
   ↓
4. GSD PLAN
   /gsd-plan-phase  (implementation plan)
   ↓
5. ANTIGRAVITY IMPLEMENTATION
   Write code via Antigravity (the primary coding environment)
   ↓
6. TEST / LINT / BUILD
   npm run lint
   npm run build
   npm run dev  (manual testing)
   ↓
7. GSD VERIFY
   /gsd-verify-work  (structured verification)
   ↓
8. USER REVIEW
   Manual review of changes
   ↓
9. GSD SHIP
   /gsd-ship  (documentation + commit)
```

## Available GSD Commands (Skills)

### Core Workflow
- `/gsd-new-project` — Initialize GSD for a new project
- `/gsd-onboard` — Onboard an existing project
- `/gsd-discuss-phase` — Requirements discussion
- `/gsd-plan-phase` — Create implementation plan
- `/gsd-execute-phase` — Execute a planned phase
- `/gsd-verify-work` — Verify completed work
- `/gsd-ship` — Ship/finalize work

### Planning & Management
- `/gsd-new-milestone` — Create a milestone
- `/gsd-complete-milestone` — Mark milestone done
- `/gsd-progress` — Check progress
- `/gsd-next` — Get next recommended action
- `/gsd-review` — Review current state

### Research & Analysis
- `/gsd-explore` — Explore codebase
- `/gsd-map-codebase` — Map codebase structure
- `/gsd-debug` — Debug an issue
- `/gsd-spike` — Research spike

### Quality
- `/gsd-add-tests` — Add tests
- `/gsd-code-review` — Code review
- `/gsd-audit-fix` — Audit and fix issues

## Cost Optimization Rules

1. **Don't rediscover** — check GSD state and project docs before asking AI
2. **One agent per task** — don't run parallel agents on the same problem
3. **Use deterministic tools first** — terminal/file ops over AI reasoning when possible
4. **No autonomous loops** — always invoke manually
5. **Verify once** — don't re-run verification when nothing changed
6. **Reuse context** — read existing plans/docs instead of regenerating

## Safety Rules

- ❌ No automatic GitHub pushes
- ❌ No automatic production deployment
- ❌ No uncontrolled autonomous loops
- ❌ No destructive commands without confirmation
- ❌ No automatic credential changes
- ❌ No background agents burning credits
- ✅ All destructive actions require user approval
