import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { exchangeToken } from "@generated/api";
import { PrimaryButton, useSnackbar } from "@shared";
import {
  clearOidcCodeVerifier,
  clearOidcState,
  getOidcCodeVerifier,
  getOidcState,
  markAuthenticated,
  redirectToOidcSignIn,
} from "../lib/auth";

export const Route = createFileRoute("/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    error_description:
      typeof search.error_description === "string" ? search.error_description : undefined,
  }),
  component: CallbackPage,
});

const resolveCallbackErrorMessage = (error: string, errorDescription?: string): string => {
  const description = errorDescription?.toLowerCase() ?? "";

  if (error === "access_denied" && description.includes("consent verifier")) {
    return "This sign-in link was already used. Start again to continue.";
  }

  if (error === "access_denied") {
    return "Sign-in was cancelled or denied. You can try again.";
  }

  return errorDescription ?? error;
};

const clearOidcSession = (): void => {
  clearOidcState();
  clearOidcCodeVerifier();
};

function CallbackPage() {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const {
    code,
    state,
    error,
    error_description: errorDescription,
  } = useSearch({
    from: "/callback",
  });
  const [message, setMessage] = useState("Completing sign-in…");
  const [canRetry, setCanRetry] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const fail = (nextMessage: string): void => {
      clearOidcSession();
      setMessage(nextMessage);
      setCanRetry(true);
      void navigate({
        to: "/callback",
        search: {
          code: undefined,
          state: undefined,
          error: undefined,
          error_description: undefined,
        },
        replace: true,
      });
    };

    const run = async () => {
      if (error) {
        fail(resolveCallbackErrorMessage(error, errorDescription));
        return;
      }

      if (!code) {
        fail("Missing authorization code.");
        return;
      }

      const expectedState = getOidcState();
      if (expectedState && state !== expectedState) {
        fail("Invalid OAuth state. Please try signing in again.");
        return;
      }

      const codeVerifier = getOidcCodeVerifier();
      if (!codeVerifier) {
        fail("Missing PKCE code verifier. Please try signing in again.");
        return;
      }

      try {
        await exchangeToken({
          body: {
            grant_type: "authorization_code",
            code,
            client_id: import.meta.env.VITE_PINE_WEB_OIDC_CLIENT_ID,
            redirect_uri: import.meta.env.VITE_PINE_WEB_OIDC_REDIRECT_URI,
            code_verifier: codeVerifier,
          },
        });

        markAuthenticated();
        clearOidcSession();
        snackbar.success("Signed in successfully.");
        await navigate({ to: "/" });
      } catch (err) {
        fail(err instanceof Error ? err.message : "Token exchange failed.");
      }
    };

    void run();
  }, [code, state, error, errorDescription, navigate, snackbar]);

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} sx={{ alignItems: "center", py: 6 }}>
        <Typography component="h1" variant="h6" textAlign="center">
          {message}
        </Typography>
        {canRetry ? (
          <PrimaryButton label="Try signing in again" onClick={redirectToOidcSignIn} />
        ) : null}
      </Stack>
    </Container>
  );
}
