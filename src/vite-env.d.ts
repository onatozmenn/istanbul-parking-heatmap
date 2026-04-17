/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEOCODE_URL: string;
  readonly VITE_MAP_STYLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
