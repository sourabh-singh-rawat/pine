import axios from "axios";
import { useOrganizationStore } from "../features/organization/store";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  console.error(
    "[pine-web] VITE_API_BASE_URL is not set. API calls will target the web app origin instead of the API gateway.",
  );
}

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

httpClient.interceptors.request.use((config) => {
  const currentOrganization = useOrganizationStore.getState().currentOrganization;
  if (!currentOrganization) {
    return config;
  }

  const headers = config.headers;
  headers.set("X-Tenant-Id", currentOrganization.tenantId);
  headers.set("X-Organization-Id", currentOrganization.id);
  return config;
});
