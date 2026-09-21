import ArrowBack from "@mui/icons-material/ArrowBack";
import { Grid2, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useFindIssueQuery, useUpdateIssueMutation } from "@generated/gql";
import type { UpdateIssueInput } from "@generated/gql/graphql";
import { AppBar } from "@pine/ui";
import { useIssueParams, useSnackbar } from "@shared";
import {
  IssueActivity,
  IssueAttachments,
  IssueDescription,
  IssueFields,
  IssueList,
  IssueModal,
  IssueName,
} from "../../components";

export const IssuePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { issueId } = useIssueParams();
  const issueQuery = useFindIssueQuery(
    { findIssueId: issueId },
    {
      select: (data) => data.findIssue ?? null,
    },
  );
  const updateIssueMutation = useUpdateIssueMutation();

  const updateIssue = async (input: UpdateIssueInput) => {
    try {
      const response = await updateIssueMutation.mutateAsync({ input });
      snackbar.success(response.updateIssue ?? "Issue updated");
      return response;
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to update issue");
      throw error;
    }
  };

  const issue = issueQuery.data;
  const projectId = issue?.project?.id ?? undefined;
  const projectName = issue?.project?.name ?? undefined;
  const issueName = issue?.name ?? undefined;
  const issueDescription = issue?.description ?? undefined;
  const statusId = issue?.statusId ?? undefined;
  const priority = issue?.priority ?? undefined;
  const resolvedIssueId = issue?.id ?? undefined;

  const handleBackToList = () => {
    if (!projectId) return;
    void navigate({ to: "/v/l/$viewId", params: { viewId: projectId } });
  };

  return (
    <Grid2 container rowGap={4} sx={{ px: theme.spacing(4) }}>
      <Grid2 size={12}>
        <AppBar
          leading={
            <IconButton
              aria-label="Back to list"
              onClick={handleBackToList}
              disabled={!projectId}
            >
              <ArrowBack />
            </IconButton>
          }
          title={<IssueName issueId={issueId} initialValue={issueName} />}
          subtitle={projectName}
        />
      </Grid2>
      {issue && issueId && projectId && statusId && priority && (
        <Grid2 size={12}>
          <IssueFields
            issueId={issueId}
            projectId={projectId}
            statusId={statusId}
            priority={priority}
            updateIssue={updateIssue}
          />
        </Grid2>
      )}

      <Grid2 size={12}>
        <IssueDescription issueId={issueId} initialValue={issueDescription} />
      </Grid2>

      <Grid2 size={12}>
        <Typography variant="body1" fontWeight="600">
          Custom Fields
        </Typography>
      </Grid2>

      {projectId && resolvedIssueId && (
        <Grid2 size={12}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body1" fontWeight="600">
                Sub Issues
              </Typography>
              <IssueModal projectId={projectId} />
            </Stack>
            <IssueList issueId={resolvedIssueId} style={{ showBorder: true }} />
          </Stack>
        </Grid2>
      )}

      <Grid2 size={12}>
        <Typography variant="body1" fontWeight="600">
          Checklists
        </Typography>
      </Grid2>

      {issueId && (
        <Grid2 size={12}>
          <Typography variant="body1" fontWeight="600">
            Attachments
          </Typography>

          <IssueAttachments issueId={issueId} />
        </Grid2>
      )}

      {issueId && (
        <Grid2 size={12}>
          <IssueActivity issueId={issueId} />
        </Grid2>
      )}
    </Grid2>
  );
};
