---
name: AI "recognize any format" import pattern
description: How this app implements "upload any file format, AI figures it out" features (used for Tujuan Pembelajaran import).
---

For a feature that must accept "any file format" and have AI extract structured data, route by file type rather than trying one universal extraction path:
- Spreadsheet-like (csv/xlsx/xls/ods/tsv): parse client-side to `string[][]` rows (SheetJS), send `rows` as JSON to the backend, prompt Gemini with the raw rows for structured JSON output.
- PDF/images (png/jpg/webp/heic): send raw base64 + mimeType straight through, no extraction — Gemini's `generateContent` accepts `{ inlineData: { data, mimeType } }` parts natively and reads PDFs/images/scans directly.
- docx: needs server-side text extraction first (the `mammoth` package, `extractRawText`) since Gemini can't read docx binary directly; feed the extracted plain text as a text prompt.
- Anything else (txt, unknown extension): decode base64 as UTF-8 text and feed as plain text — same code path as docx-after-extraction.

**Why:** Gemini's native multimodal input only covers PDF/image; spreadsheets need pre-parsing to avoid wasting tokens on raw binary, and docx has no native support at all.

**How to apply:** reuse this three-way split (rows vs. inlineData vs. extracted-text) for any future "AI import from any format" feature rather than inventing a new dispatch strategy.
