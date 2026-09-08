# Gimme Idea Analytics Setup

This implementation deliberately separates acquisition analytics from canonical product events:

- GA4 records consented traffic source, campaign parameters, and App Router page views.
- PostgreSQL records important product state transitions after the canonical database state changes.

## GA4

### Configure

1. In Google Analytics, create a GA4 property and a Web data stream for the production domain.
2. Copy the Measurement ID (`G-XXXXXXXXXX`).
3. Add it to the Vercel Production environment:

   ```text
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_GA_DEBUG=false
   ```

4. Redeploy the frontend. `NEXT_PUBLIC_*` values are embedded during the Next.js build.
5. In the GA4 Web stream's Enhanced Measurement settings, disable page views based on browser-history changes. Gimme Idea sends one manual `page_view` for the initial URL and each App Router navigation, so leaving both systems enabled can duplicate SPA page views.

GA4 stays completely disabled when the Measurement ID is missing or invalid. When configured, the application asks for analytics consent in English or Vietnamese. Advertising storage, advertising user data, personalization, and Google signals remain disabled even after analytics consent is granted.

### Verify

For a temporary validation deployment, set `NEXT_PUBLIC_GA_DEBUG=true`, redeploy, accept analytics in the site banner, and open:

```text
https://www.gimmeidea.com/en?utm_source=analytics_check&utm_medium=manual&utm_campaign=ga4_launch
```

Navigate to at least two client-side routes. In GA4, open **Admin → DebugView** and confirm one `page_view` per URL. Then inspect **Reports → Acquisition** for `analytics_check / manual` after GA finishes processing attribution data.

Set `NEXT_PUBLIC_GA_DEBUG=false` and redeploy after validation so normal visitor traffic is not labeled as developer traffic.

To repeat the consent check on one browser, remove the local-storage key below and reload:

```js
localStorage.removeItem('gimme.analytics-consent.v1');
location.reload();
```

## First-party product events

Migration `20260908120000_product_analytics.sql` creates `public.analytics_events`. Database triggers write events atomically and use a unique `dedupe_key`, so API retries do not inflate counts.

| Event               | Canonical condition                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `problem_created`   | A Problem row is created, initially as a draft.                                                                |
| `idea_submitted`    | An Idea first transitions to `published`. Draft creation alone is not counted.                                 |
| `bounty_funded`     | Chain reconciliation first moves a Bounty to `funded` or `open`. A submitted wallet transaction is not enough. |
| `project_published` | A Project is first created as public or changes from non-public to public.                                     |

The table intentionally excludes titles, creator content, email addresses, OAuth identifiers, and wallet addresses. Browser roles cannot select from or insert into it; inspect it through the Supabase dashboard SQL editor or a trusted server connection.

### Verify in Supabase

Confirm the table and triggers:

```sql
select trigger_name, event_object_table
from information_schema.triggers
where trigger_name like 'analytics_%'
order by trigger_name;
```

Inspect recent events without exposing private content:

```sql
select event_name, entity_type, entity_id, source, properties, occurred_at
from public.analytics_events
order by occurred_at desc
limit 100;
```

Daily conversion counts:

```sql
select
  date_trunc('day', occurred_at) as day,
  event_name,
  count(*) as events,
  count(distinct actor_user_id) filter (where actor_user_id is not null) as actors
from public.analytics_events
group by 1, 2
order by 1 desc, 2;
```

The migration does not backfill old rows. This keeps the analytics start time honest; events begin when the migration is applied.
