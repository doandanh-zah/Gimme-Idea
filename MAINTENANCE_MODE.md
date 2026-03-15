# Maintenance Mode Configuration

To enable maintenance mode on the frontend, add the following to `frontend/.env.local`:

```env
MAINTENANCE_MODE=true
```

To disable maintenance mode:

```env
MAINTENANCE_MODE=false
```

Or simply remove the `MAINTENANCE_MODE` line entirely.

## How it works:

1. When `MAINTENANCE_MODE=true`, all page requests (except API routes, static files, and the maintenance page itself) will be redirected to `/maintenance`
2. The maintenance page displays a professional "Under Maintenance" message
3. API routes continue to function normally
4. Simply toggle the environment variable to enable/disable maintenance mode

## To activate:

1. Create or edit `frontend/.env.local`
2. Add `MAINTENANCE_MODE=true`
3. Restart the development server
4. Access the site - all pages will show the maintenance page
5. To disable, change to `MAINTENANCE_MODE=false` and restart

That's it! No code changes needed after initial setup.
