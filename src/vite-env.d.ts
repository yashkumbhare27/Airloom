/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROXY_URL: string;
  readonly VITE_MAPS_KEY: string;
  readonly VITE_CLOUD_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
