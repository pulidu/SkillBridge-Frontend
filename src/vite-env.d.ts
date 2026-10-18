/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_DIRECT_URL?: string;
  readonly VITE_DEV_PORT?: string;
  readonly VITE_PREVIEW_PORT?: string;
  readonly VITE_DEV_HOST?: string;
  readonly VITE_PROXY_TARGET?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
