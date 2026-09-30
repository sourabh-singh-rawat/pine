// Required by EnvSchema before any module under test imports `@/env`.
process.env.ISSUES_DATABASE_URL ??= "postgres://localhost:5432/issues_test";
