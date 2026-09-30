process.env.IDENTITY_DATABASE_URL ??= "postgres://localhost:5432/identity_test";
process.env.IDENTITY_SERVICE_TLS_KEY_PATH ??= "test-tls-key.pem";
process.env.IDENTITY_SERVICE_TLS_CERT_PATH ??= "test-tls-cert.pem";
process.env.CA_CERT_PATH ??= "test-ca-cert.pem";
