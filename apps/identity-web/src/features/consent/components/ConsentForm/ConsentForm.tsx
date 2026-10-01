import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PrimaryButton, ProgressCircularIndicator, SecondaryButton } from "@pine/ui";
import { useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAcceptConsentChallengeMutation,
  useGetConsentChallengeQuery,
  useRejectConsentChallengeMutation,
} from "@generated/api/@tanstack/react-query.gen";
import { ConsentAppBlock } from "@features/consent/components/ConsentAppBlock";
import { ConsentCardShell } from "@features/consent/components/ConsentCardShell";
import { ConsentScopeList } from "@features/consent/components/ConsentScopeList";
import { useConsentStore } from "@features/consent/stores";
import { getErrorMessage, useSnackbar } from "@shared/ui";

const REMEMBER_FOR_SECONDS = 3600;

export const ConsentForm = () => {
  useConsentStore();
  const snackbar = useSnackbar();

  const { consent_challenge: consentChallenge } = useSearch({ from: "/(no-auth)/consent" });
  const [remember, setRemember] = useState(true);
  const [skipFailed, setSkipFailed] = useState(false);
  const skipAcceptStarted = useRef(false);

  const consentChallengeQuery = useGetConsentChallengeQuery({
    query: { consent_challenge: consentChallenge ?? "" },
  });

  const acceptConsentMutation = useAcceptConsentChallengeMutation();
  const rejectConsentMutation = useRejectConsentChallengeMutation();

  const challenge = consentChallengeQuery.data;
  const isBusy = acceptConsentMutation.isPending || rejectConsentMutation.isPending;
  const shouldAutoAcceptSkip = Boolean(challenge?.skip) && !skipFailed;

  const accept = useCallback(async () => {
    if (!consentChallenge || !challenge || isBusy) {
      return;
    }

    try {
      const result = await acceptConsentMutation.mutateAsync({
        query: { consent_challenge: consentChallenge },
        body: {
          grantScope: challenge.requestedScope,
          remember,
          ...(remember ? { rememberFor: REMEMBER_FOR_SECONDS } : {}),
        },
      });
      window.location.assign(result.redirectTo);
    } catch (error) {
      setSkipFailed(true);
      snackbar.error(getErrorMessage(error, "Unable to approve access. Please try again."));
    }
  }, [acceptConsentMutation, challenge, consentChallenge, isBusy, remember, snackbar]);

  const reject = useCallback(async () => {
    if (!consentChallenge || isBusy) {
      return;
    }

    try {
      const result = await rejectConsentMutation.mutateAsync({
        query: { consent_challenge: consentChallenge },
        body: {
          error: "access_denied",
          errorDescription: "User denied consent",
        },
      });
      window.location.assign(result.redirectTo);
    } catch (error) {
      snackbar.error(getErrorMessage(error, "Unable to deny access. Please try again."));
    }
  }, [consentChallenge, isBusy, rejectConsentMutation, snackbar]);

  useEffect(() => {
    if (!shouldAutoAcceptSkip || skipAcceptStarted.current || !consentChallenge) {
      return;
    }

    skipAcceptStarted.current = true;
    void accept();
  }, [accept, consentChallenge, shouldAutoAcceptSkip]);

  if (!consentChallenge) {
    return (
      <ConsentCardShell>
        <Typography color="error">Missing consent challenge.</Typography>
      </ConsentCardShell>
    );
  }

  if (consentChallengeQuery.isError) {
    return (
      <ConsentCardShell>
        <Typography color="error">
          {getErrorMessage(consentChallengeQuery.error, "Unable to load consent request.")}
        </Typography>
      </ConsentCardShell>
    );
  }

  if (consentChallengeQuery.isLoading || !challenge || shouldAutoAcceptSkip) {
    return (
      <ConsentCardShell>
        <Stack spacing={2} sx={{ alignItems: "flex-start", py: 2 }}>
          <ProgressCircularIndicator
            size={40}
            aria-label={
              shouldAutoAcceptSkip ? "Continuing with saved consent" : "Loading consent request"
            }
          />
          <Typography color="text.secondary">
            {shouldAutoAcceptSkip ? "Continuing with saved consent…" : "Loading consent request…"}
          </Typography>
        </Stack>
      </ConsentCardShell>
    );
  }

  const clientName = challenge.client.name ?? challenge.client.id;

  return (
    <ConsentCardShell>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 400 }}>
            Authorize application
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {clientName} wants access to your Pine account. Review the permissions below, then allow
            or deny.
          </Typography>
        </Box>

        <Stack spacing={1}>
          <ConsentAppBlock
            clientName={clientName}
            clientId={challenge.client.id}
            subject={challenge.subject}
          />
          <ConsentScopeList scopes={challenge.requestedScope} />
        </Stack>

        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              onChange={(_event, checked) => {
                setRemember(checked);
              }}
              disabled={isBusy}
            />
          }
          label="Remember this choice for one hour"
        />

        <Stack direction="row" spacing={1} useFlexGap sx={{ justifyContent: "flex-end" }}>
          <SecondaryButton
            label="Deny"
            onClick={() => {
              void reject();
            }}
          />
          <PrimaryButton
            label="Allow"
            loading={acceptConsentMutation.isPending}
            isDisabled={isBusy}
            onClick={() => {
              void accept();
            }}
          />
        </Stack>
      </Stack>
    </ConsentCardShell>
  );
};
