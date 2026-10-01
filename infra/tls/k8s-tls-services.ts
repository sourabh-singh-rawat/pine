export type K8sTlsService = {
  certDir: string;
  secretName: string;
  dnsNames: readonly string[];
};

const pineDns = (shortName: string): readonly string[] => [
  shortName,
  `${shortName}.pine.svc`,
  `${shortName}.pine.svc.cluster.local`,
];

export const k8sTlsServices: readonly K8sTlsService[] = [
  {
    certDir: "api-gateway",
    secretName: "api-gateway-tls",
    dnsNames: pineDns("api-gateway"),
  },
  {
    certDir: "data-gateway",
    secretName: "data-gateway-tls",
    dnsNames: pineDns("data-gateway"),
  },
  {
    certDir: "identity-service",
    secretName: "identity-tls",
    dnsNames: [...pineDns("identity"), "identity-service"],
  },
  {
    certDir: "items-service",
    secretName: "items-tls",
    dnsNames: [...pineDns("items"), "items-service"],
  },
  {
    certDir: "attachment-service",
    secretName: "attachment-tls",
    dnsNames: [...pineDns("attachment"), "attachment-service"],
  },
  {
    certDir: "attachment-image-processing-service",
    secretName: "attachment-image-processing-tls",
    dnsNames: [...pineDns("attachment-image-processing"), "attachment-image-processing-service"],
  },
  {
    certDir: "attachment-scanner-service",
    secretName: "attachment-scanner-tls",
    dnsNames: [...pineDns("attachment-scanner"), "attachment-scanner-service"],
  },
  {
    certDir: "audit-service",
    secretName: "audit-tls",
    dnsNames: [...pineDns("audit"), "audit-service"],
  },
  {
    certDir: "notification-service",
    secretName: "notification-tls",
    dnsNames: [...pineDns("notification"), "notification-service"],
  },
  {
    certDir: "platform-service",
    secretName: "platform-tls",
    dnsNames: [...pineDns("platform"), "platform-service"],
  },
  {
    certDir: "authorization-service",
    secretName: "authorization-tls",
    dnsNames: [...pineDns("authorization"), "authorization-service"],
  },
  {
    certDir: "oauth-service",
    secretName: "oauth-tls",
    dnsNames: [...pineDns("oauth"), "oauth-service"],
  },
];

export const localOnlyCertDirs: readonly string[] = ["identity-web", "pine-web", "platform-web"];
