# V1 privacy model

Privacy is enforced by the API repository and backed by PostgreSQL constraints/RLS. A direct identifier is never authorization.

| Object / actor             |             Public | Owner / entrant |            Build participant |                         Company judge |                         Platform moderator |
| -------------------------- | -----------------: | --------------: | ---------------------------: | ------------------------------------: | -----------------------------------------: |
| Published public Problem   |               full |            full |                         full |                                  full |                                       full |
| Published public Idea      |               full |            full |                         full |                                  full |                                       full |
| Restricted winning Idea    |       summary only |      per rights | full after exact Build terms |          full for owning organization | only through an audited moderation purpose |
| Private Idea Submission    |                 no |            full |                     own only | full for assigned/owning organization |               explicit audited access only |
| Private Build Project      |                 no |   full for team |           own workspace only |  judging snapshot, not live workspace |               explicit audited access only |
| Restricted winning Project | restricted summary |     team rights |         no competitor access |                   owning organization |               explicit audited access only |

An authorized Build participant accepts the exact current terms hash before the selected Idea is serialized in full or a private Project is created. Organization membership is not Solana authority; judge and arbitration keys are separate operational concerns.

Quote/Post creation first resolves the target and requires public visibility. A quoted snapshot cannot be used to bypass later access checks. Public search and Home select only public entities and public Posts; they never union Submission payloads, private attachments, private Project bodies, judge notes, or private research.

AI research receives public canonical Problem/Idea fields only. Private submissions are excluded from general retrieval and training-style workflows. A private landscape check would need explicit entrant consent and a dedicated non-retention provider configuration; it is not enabled in this implementation.

Public media and private-submission media use separate buckets. Submission attachments must be `private` and in `private-submissions`. Upload intent metadata is actor-bound; private reads re-check owner/judge/organization access and return a short-lived signed URL. Unauthorized direct reads return 404 so identifiers do not reveal existence.

Moderation does not imply a generic data browser. Current code records flags, but complete audited moderator-access tooling is not implemented; until it is, moderator access to private content is not an operational claim. Audit payloads must avoid tokens, raw private bodies, signed URLs, and credentials.
