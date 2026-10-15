---
name: PPTX preview privacy
description: Privacy and deployment choice for viewing PowerPoint files in GuruEOB5.
---

For GuruEOB5, preview `.pptx` files in the browser after fetching them through the authenticated app API. Do not use public Google Slides or Microsoft web viewers as the default.

**Why:** School documents should remain within the app's access controls. External viewers require a public URL or transfer the file to a third party, and the production app is deployed outside Replit on Coolify.

**How to apply:** Use client-side rendering for PowerPoint previews. Treat Word and spreadsheet previews as separate format work; do not make private documents public only to enable previews.
