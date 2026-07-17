---
name: Gemini structured-output + storage guard decisions
description: Why thinkingBudget:0 is needed for modul ajar, and AI content row-limit pattern
---

## Rule
Always add `thinkingConfig: { thinkingBudget: 0 }` when calling Gemini 2.5 Flash with a `responseSchema` (structured JSON output). Without it, the thinking pass can produce an empty or malformed text field that breaks JSON.parse.

**Why:** gemini-2.5-flash enables thinking by default. Thinking tokens do not appear in `response.text`, but they can interfere with the final JSON generation, causing empty responses or parse failures — especially for deeply nested schemas like ModulAjarContent.

**How to apply:** Add to the `config` block of any `gemini.models.generateContent` call that uses `responseMimeType: "application/json"` + `responseSchema`.

## Storage guard pattern
After any AI content insert (modul ajar, soal otomatis, etc.), query all row IDs for that teacher ordered newest-first and delete any rows beyond MAX_PER_TEACHER (15). Keep this as a non-fatal cleanup (warn on error, do not fail the request).

**Why:** Each modul ajar row stores a large JSONB blob (~10-50 KB). With many teachers generating frequently, this grows unbounded. The guard caps per-teacher storage without requiring a cron job.

## Feedback screenshot storage
Screenshots from html2canvas are stored as base64 JPEG (0.7 quality, 0.6 scale) in the `feedback.screenshot_base64` text column. Capped at 2 MB server-side. Widget and floating button both carry class `feedback-ignore` so html2canvas skips them, keeping the screenshot clean.

## tpNumber OpenAPI cap removed
GradeInput.tpNumber previously had `maximum: 4` in openapi.yaml. Removed because tpNumber is now a continuous sequence across all Lingkup Materi (not reset per LM), so values > 4 are valid and expected.
