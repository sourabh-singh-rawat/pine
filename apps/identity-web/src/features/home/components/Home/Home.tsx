import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useGetCurrentUserQuery } from "@generated/api/@tanstack/react-query.gen";
import { LocationBreadcrumbs } from "../LocationBreadcrumbs";
import { CreateProfileForm } from "../CreateProfileForm";
import { EmailBlock } from "../EmailBlock";
import { GenderBlock } from "../GenderBlock";
import { NameBlock } from "../NameBlock";
import { ProfilePhotoBlock } from "../ProfilePhotoBlock";
import { isMeProfile } from "@features/home/utils";
import { Link } from "@tanstack/react-router";

export const Home = () => {
  const currentUserQuery = useGetCurrentUserQuery();
  const identity = currentUserQuery.data?.data?.identity;
  const rawProfile = currentUserQuery.data?.data?.profile;
  const profile = isMeProfile(rawProfile) ? rawProfile : null;

  if (currentUserQuery.isPending) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="text.secondary">Loading session…</Typography>
      </Container>
    );
  }

  if (!identity) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h1">
            Personal info
          </Typography>
          <Typography color="text.secondary">
            Sign in to view your profile.{" "}
            <Link to="/signin" search={{ login_challenge: undefined }}>
              Go to sign in
            </Link>
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={4}>
          <Box>
            <LocationBreadcrumbs items={[{ label: "Personal info" }]} />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 400, mt: 1 }}>
              Personal info
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set up your personal info.
            </Typography>
          </Box>

          <EmailBlock email={identity.email} emailVerified={identity.emailVerified} />
          <CreateProfileForm />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Box>
          <LocationBreadcrumbs items={[{ label: "Personal info" }]} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 400, mt: 1 }}>
            Personal info
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Info on your account, like your name and email.
          </Typography>
        </Box>

        <Stack spacing={1}>
          <ProfilePhotoBlock photoUrl={profile.photoUrl} fullName={profile.fullName} />
          <NameBlock fullName={profile.fullName} to="/name" />
          <GenderBlock gender={profile.gender} to="/gender" />
          <EmailBlock email={identity.email} emailVerified={identity.emailVerified} />
        </Stack>
      </Stack>
    </Container>
  );
};
