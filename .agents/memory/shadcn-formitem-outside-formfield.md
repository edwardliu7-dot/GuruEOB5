---
name: shadcn FormItem outside FormField
description: FormItem/FormLabel/FormControl from ui/form.tsx require a FormField ancestor or the app crashes at runtime.
---

The shadcn `ui/form.tsx` primitives (`FormItem`, `FormLabel`, `FormControl`, `FormMessage`) call `useFormField()`, which reads context set up by `<FormField control={...} name={...}>`. If you render any of them for a plain, non-react-hook-form-registered input (e.g. a raw file picker that you manage with local `useState` instead of the form schema), it throws `useFormField should be used within <FormField>` and takes down the whole page (Vite error overlay, blank screen after dismissing).

**Why:** it's tempting to reach for `FormItem`/`FormLabel` for visual consistency with the rest of a form, but they are not just styled wrappers — they depend on `FormField` context.

**How to apply:** for any field that isn't wired through `useForm`/`FormField` (e.g. a file input tracked with its own `useState`, an upload progress row, etc.), use plain `Label` + `Input`/other primitives instead, wrapped in a plain `<div className="space-y-2">`. Only use `FormItem`/`FormLabel`/`FormControl` inside an actual `<FormField>` render prop.
