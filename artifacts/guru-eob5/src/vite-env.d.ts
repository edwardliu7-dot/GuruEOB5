/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Injected at Docker build time (millisecond timestamp). Changes on every
   *  deploy so all users see the "What's New" dialog after an update.
   *  Undefined in the Vite dev server — falls back to APP_VERSION. */
  readonly VITE_BUILD_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
