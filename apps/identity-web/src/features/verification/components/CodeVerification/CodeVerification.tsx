import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useVerifyEmailQuery } from "@generated/api/@tanstack/react-query.gen";
import { Link, useSearch } from "@tanstack/react-router";

type VerificationStatus = "missing" | "verifying" | "success" | "error";

const statusMessage: Record<Exclude<VerificationStatus, "verifying">, string> = {
  missing: "This verification link is missing required information.",
  success: "Email verified successfully.",
  error: "We could not verify your email. The link may be invalid or expired.",
};

const statusColor: Record<Exclude<VerificationStatus, "verifying">, "error" | "success.main"> = {
  missing: "error",
  error: "error",
  success: "success.main",
};

function resolveStatus(
  hasParams: boolean,
  isPending: boolean,
  isSuccess: boolean,
  isError: boolean,
): VerificationStatus {
  if (!hasParams) {
    return "missing";
  }
  if (isPending) {
    return "verifying";
  }
  if (isSuccess) {
    return "success";
  }
  if (isError) {
    return "error";
  }
  return "verifying";
}

export const CodeVerification = () => {
  const { flow, code } = useSearch({ from: "/(no-auth)/verification" });
  const hasParams = flow !== undefined && code !== undefined;

  const verifyEmailQuery = useVerifyEmailQuery({
    query: { code: code !== undefined ? String(code) : "", flow: flow ?? "" },
  });

  const status = resolveStatus(
    hasParams,
    verifyEmailQuery.isPending,
    verifyEmailQuery.isSuccess,
    verifyEmailQuery.isError,
  );

  if (status === "verifying") {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <div>
            <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="70%" />
          </div>
        </Stack>
      </Container>
    );
  }

  const message =
    status === "success"
      ? (verifyEmailQuery.data?.data?.message ?? statusMessage.success)
      : statusMessage[status];
  const showSignIn = status === "success";
  const showResend = status === "error" || status === "missing";

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <div>
          <Typography variant="h5" component="h1" gutterBottom>
            Code verification
          </Typography>
          <Typography color={statusColor[status]}>{message}</Typography>
        </div>

        {showSignIn && (
          <Button component={Link} to="/signin" variant="contained">
            Continue to sign in
          </Button>
        )}

        {showResend && (
          <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Typography variant="body2" color="text.secondary">
              Need a new verification email?
            </Typography>
            <Button component={Link} to="/resend-verification" variant="outlined">
              Resend verification email
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
