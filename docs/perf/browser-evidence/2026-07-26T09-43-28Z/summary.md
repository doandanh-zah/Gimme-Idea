# Browser Evidence

Generated: 2026-07-26T09:47:31.029Z
Base URL: http://localhost:3000
Idle window for /idea network proof: 180000 ms

## Screenshots
- mobile-375 /landing: 200 -> screenshot-mobile-375-landing.png
- mobile-375 /idea: 200 -> screenshot-mobile-375-idea.png
- mobile-375 /docs: 200 -> screenshot-mobile-375-docs.png
- mobile-375 /hackathons: 200 -> screenshot-mobile-375-hackathons.png
- mobile-375 /auth/agent: 200 -> screenshot-mobile-375-auth__agent.png
- mobile-375 /settings/tokens: 200 -> screenshot-mobile-375-settings__tokens.png
- tablet-768 /landing: 200 -> screenshot-tablet-768-landing.png
- tablet-768 /idea: 200 -> screenshot-tablet-768-idea.png
- tablet-768 /docs: 200 -> screenshot-tablet-768-docs.png
- tablet-768 /hackathons: 200 -> screenshot-tablet-768-hackathons.png
- tablet-768 /auth/agent: 200 -> screenshot-tablet-768-auth__agent.png
- tablet-768 /settings/tokens: 200 -> screenshot-tablet-768-settings__tokens.png
- desktop-1280 /landing: 200 -> screenshot-desktop-1280-landing.png
- desktop-1280 /idea: 200 -> screenshot-desktop-1280-idea.png
- desktop-1280 /docs: 200 -> screenshot-desktop-1280-docs.png
- desktop-1280 /hackathons: 200 -> screenshot-desktop-1280-hackathons.png
- desktop-1280 /auth/agent: 200 -> screenshot-desktop-1280-auth__agent.png
- desktop-1280 /settings/tokens: 200 -> screenshot-desktop-1280-settings__tokens.png

## Smoke Routes
- /landing: 200
- /idea: 200
- /docs: 200
- /hackathons: 200
- /auth/agent: 200
- /settings/tokens: 200
- /feeds/test-feed: 200
- /idea/test-idea: 200
- /projects/test-project: 200
- /profile/test-user: 200
- /hackathons/test-event: 200
- /does-not-exist: 404
- flow landing-explore-ideas: pass (http://localhost:3000/idea)

## Network / Egress
- HAR: network-idea-logged-out.har
- Request log: network-idea-logged-out.ndjson
- Total requests: 36
- Fetch/XHR requests: 3
- WebSockets: 0
- Supabase realtime WebSockets: 0
- Repeated fetch/XHR URLs: 0
- Forbidden wallet/native/polyfill strings in initial JS: 0

## Wallet Intent Boundary
- HAR: wallet-intent.har
- Request log: wallet-intent.ndjson
- Initial requests before wallet intent: 36
- Requests after wallet intent: 9
- Wallet modal visible after click: yes
- Wallet/native/polyfill JS hits before intent: 0
- Wallet/provider JS hits after intent: 3
  - after http://localhost:3000/_next/static/chunks/5977-ab1bf28ba8b95a62.js: wallet-adapter
  - after http://localhost:3000/_next/static/chunks/8757.ab5bd30506151815.js: Lazorkit
  - after http://localhost:3000/_next/static/chunks/aaea2bcf-7fe97ca0bcb0c4ad.js: crypto-browserify

## Data Revisit
- HAR: data-revisit.har
- Request log: data-revisit.ndjson
- Flow /idea -> first detail -> /idea: pass
- Backend API fetch/XHR requests: 2
- Idea list API requests: 1
- Repeated idea list API URLs: 0

## Browser XSS Proof
- Payloads tested in Chromium: 7
- Result: pass
- "<script>window.__xss = \"script\"</script>" -> executed=false, dangerousPatterns=0
- "<img src=x onerror=\"window.__xss = 'img-onerror'\">" -> executed=false, dangerousPatterns=0
- "<svg><script>window.__xss = \"svg-script\"</script></svg>" -> executed=false, dangerousPatterns=0
- "[click](javascript:window.__xss = \"javascript-href\")" -> executed=false, dangerousPatterns=0
- "[click](data:text/html,<script>window.__xss = \"data-html\"</script>)" -> executed=false, dangerousPatterns=0
- "<a href=\"javascript:window.__xss = 'raw-anchor'\">click</a>" -> executed=false, dangerousPatterns=0
- "![x](javascript:window.__xss = \"javascript-image\")" -> executed=false, dangerousPatterns=0

## Result
Pass
