/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DATA_GATEWAY_URL?: string;
  readonly VITE_IDENTITY_WEB_URL?: string;
  readonly VITE_EMAIL_VERIFICATION_REDIRECT_URL?: string;
  readonly VITE_PINE_WEB_OIDC_CLIENT_ID: string;
  readonly VITE_PINE_WEB_OIDC_REDIRECT_URI: string;
  readonly VITE_OIDC_SCOPES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
