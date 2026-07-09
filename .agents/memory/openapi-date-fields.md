---
name: OpenAPI date/timestamp fields need explicit format
description: Zod parse errors on Drizzle Date objects when timestamp fields lack format:date-time in the OpenAPI spec
---

Drizzle `timestamp` columns return native JS `Date` objects. Orval's zod generator only
emits date-coercing schemas when the OpenAPI field is tagged `type: string` **and**
`format: date-time`. If a field is just `type: string`, Orval generates a plain
`zod.string()`, and `Schema.parse(dbRow)` throws because `Date` !== `string` under Zod,
even though `orval.config.ts` has `coerce: { response: ['date'] }` and `useDates: true`
configured — those only apply when the field is recognized as a date type.

**Why:** Hit this as a real 500 error on a register endpoint — response validation failed
because `createdAt` came back as a `Date` from Drizzle but the generated Zod schema
expected a `string`.

**How to apply:** Whenever adding a timestamp/date field to `lib/api-spec/openapi.yaml`
that maps to a Drizzle `timestamp` column, add both `type: string` and
`format: date-time`, then rerun `pnpm --filter @workspace/api-spec run codegen`.
