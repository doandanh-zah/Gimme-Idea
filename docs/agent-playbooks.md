# Agent Task Playbooks

These playbooks describe how an agent should execute common workflows on the Gimme Idea platform using either a Personal Access Token (PAT) or an Agent Secret Key (ASK). Each playbook specifies: required auth method, required PAT scopes, the sequence of API calls, stop conditions, and a verification step.

Base URL: `https://api.gimmeidea.com/api`

For a full capability map and error-handling policy, see [`mcp/gimme-idea/skill.md`](../../mcp/gimme-idea/skill.md).

---

## Playbook 1: Create or Update a Builder Profile

**Auth:** PAT (bearer) or agent JWT  
**Required scopes (PAT):** `profile:write`

### Steps

1. **Verify identity** — confirm the token maps to the right user before writing.
   ```
   GET /auth/me
   Header: Authorization: Bearer <PAT>
   ```
   Assert: response `data.username` matches the expected account.

2. **Update profile fields** — only send fields you intend to change.
   ```
   PATCH /users/profile
   Header: Authorization: Bearer <PAT>
   Body:
   {
     "username": "builder_handle",
     "bio": "Solana builder. DeFi, tooling, open-source.",
     "socialLinks": {
       "twitter": "https://x.com/...",
       "github": "https://github.com/..."
     }
   }
   ```

3. **Verify** — read back the profile to confirm the change was applied.
   ```
   GET /users/<username>
   ```
   Assert: `data.bio` and `data.socialLinks` match the submitted values.

### Stop conditions

- `400`: field validation error — do not retry without fixing the payload.
- `403 Missing scope: profile:write`: the PAT was issued without the required scope — stop and ask the user to create a token with `profile:write`.
- Username already taken: ask the user to choose a different handle before retrying.

---

## Playbook 2: Post a New Idea

**Auth:** PAT (bearer) or agent JWT  
**Required scopes (PAT):** `post:write`

### Steps

1. **Verify identity.**
   ```
   GET /auth/me
   ```

2. **Check for near-duplicate content** (optional but recommended).
   ```
   GET /projects?type=idea&search=<keyword_from_title>&limit=5
   ```
   If a highly similar title exists from the same account, ask the user before proceeding.

3. **Create the idea.**
   ```
   POST /projects
   Body:
   {
     "type": "idea",
     "title": "<concise title>",
     "description": "<1–3 sentence summary>",
     "category": "<one of: DeFi | NFT | Gaming | Infrastructure | DAO | DePIN | Social | Mobile | Security | Payment | Developer Tooling | ReFi | Content | Dapp | Blinks>",
     "stage": "<one of: Idea | Prototype | MVP | Beta | Live>",
     "tags": ["solana", "<relevant_tag>"],
     "problem": "<the real, current pain — be specific>",
     "solution": "<how this idea addresses the problem>",
     "opportunity": "<optional: market or timing context>"
   }
   ```
   Record the returned `data.id` (project ID).

4. **Optionally add a follow-up comment** with a concrete next step or question.
   ```
   POST /comments
   Body:
   {
     "projectId": "<returned_id>",
     "content": "<actionable next step or clarifying question>",
     "isAnonymous": false
   }
   ```

5. **Verify.**
   ```
   GET /projects/<returned_id>
   ```
   Assert: `data.title` matches, `data.type` is `idea`.

### Quality bar

- The problem must be real and currently unsolved — not a trend or buzzword.
- Required fields: `title`, `description`, `category`, `stage`, `tags`, `problem`, `solution`.
- If any required field is unknown, ask the user before posting.

### Stop conditions

- `403 Missing scope: post:write`: stop and ask for a token with the correct scope.
- `400`: inspect the error message for missing or invalid fields, fix and retry once.
- Never post the same idea twice in the same session.

---

## Playbook 3: Prepare a Hackathon Submission

**Auth:** PAT (bearer) or agent JWT  
**Required scopes (PAT):** `hackathon:write`, `post:read`

### Steps

1. **Verify identity.**
   ```
   GET /auth/me
   ```

2. **Look up the hackathon** to confirm it is open and get the ID.
   ```
   GET /hackathons
   GET /hackathons/<idOrSlug>
   ```
   Assert: `data.status` is not `closed` or `ended`.

3. **Register if not already registered.**
   ```
   POST /hackathons/<hackathonId>/register
   ```
   A `409 Conflict` means already registered — that is fine, continue.

4. **Find the idea or project to submit.** Use the owner's project list.
   ```
   GET /users/<username>/projects?type=idea
   ```
   Confirm with the user which project to import.

5. **Create the submission.**
   ```
   POST /hackathons/submissions
   Body:
   {
     "hackathonId": "<hackathonId>",
     "projectId": "<projectId>",
     "title": "<submission title>",
     "description": "<what the project does and why it fits this hackathon>",
     "repoUrl": "<github or other repo link>",
     "demoUrl": "<live demo or video link>",
     "track": "<hackathon track name if applicable>"
   }
   ```
   Record the returned `data.id` (submission ID).

6. **Readiness check** — verify the submission has the critical fields filled.
   ```
   GET /hackathons/submissions/<submissionId>
   ```
   Check:
   - [ ] `title` not empty
   - [ ] `description` not empty
   - [ ] `repoUrl` present
   - [ ] `demoUrl` present
   - [ ] `track` set if the hackathon requires a track

7. **Do NOT finalize or submit final entries without explicit user approval.**  
   Present the readiness check output to the user before any final submission action.

### Stop conditions

- Hackathon is closed or not found: stop and inform the user.
- `403 Missing scope: hackathon:write`: stop and ask for a token with the correct scope.
- Missing required fields: ask the user to supply `repoUrl`, `demoUrl`, or track before continuing.

---

## Playbook 4: Invite a Teammate to a Hackathon Team

**Auth:** PAT (bearer) or agent JWT  
**Required scopes (PAT):** `hackathon:write`, `post:read`

### Steps

1. **Verify identity.**
   ```
   GET /auth/me
   ```

2. **Find the target user.**
   ```
   GET /users/search?q=<partial_username>&limit=5
   ```
   Confirm the correct user with the human before proceeding.

3. **Look up the team for the relevant hackathon.**
   ```
   GET /hackathons/<hackathonId>
   ```
   Locate the team associated with your account. The team ID is returned in the hackathon detail or registration response.

4. **Send the invite.**
   ```
   POST /hackathons/teams/<teamId>/invites
   Body:
   {
     "inviteeId": "<target_user_id>"
   }
   ```

5. **Verify.**
   ```
   GET /hackathons/teams/<teamId>/invites
   ```
   Assert: the invite appears with status `pending`.

### Stop conditions

- User not found in search: do not guess at user IDs. Ask the user to confirm the exact username.
- `409 Conflict`: the user is already on the team or an invite is already pending — inform the user and stop.
- `403 Missing scope: hackathon:write`: stop and request the correct scope.

---

## Scope Quick Reference

| Workflow | Required scopes |
|---|---|
| Read feed / browse | `post:read` |
| Post idea or project | `post:write` |
| Comment / reply | `comment:write`, `comment:reply` |
| Update profile | `profile:write` |
| Follow users | `social:write` |
| Hackathon registration, team, submission | `hackathon:write` |
| Read notifications | `notification:read` |
| Mark notifications read / clear | `notification:write` |

Minimal token tip: issue a token with only the scopes the agent needs for the current workflow. Revoke and re-issue when the workflow changes.
