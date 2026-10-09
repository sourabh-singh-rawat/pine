import MuiContainer from "@mui/material/Container";
import Grid2 from "@mui/material/Grid2";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import type { CreateSpaceInput } from "@generated/gql/graphql";
import { useCreateSpaceMutation, useGetSpacesQuery } from "@generated/gql";
import { useOrganizationStore } from "@features/organization";
import { PrimaryButton, TextField, useSnackbar } from "@shared";

type SpaceFormValues = {
  name: string;
};

type SpaceFormProps = {
  onSuccess?: () => void;
};

export const SpaceForm = ({ onSuccess }: SpaceFormProps) => {
  const messageBar = useSnackbar();
  const queryClient = useQueryClient();
  const createSpaceMutation = useCreateSpaceMutation();
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization);

  const defaultValues: SpaceFormValues = useMemo(() => ({ name: "" }), []);
  const form = useForm({
    defaultValues,
    mode: "all",
  });

  const onSubmit: SubmitHandler<SpaceFormValues> = async ({ name }) => {
    if (!currentOrganization) {
      messageBar.error("Select a organization before creating a space");
      return;
    }

    const input: CreateSpaceInput = {
      organizationId: currentOrganization.id,
      name,
    };

    try {
      await createSpaceMutation.mutateAsync({ input });
      await queryClient.invalidateQueries({
        queryKey: useGetSpacesQuery.getKey({ organizationId: currentOrganization.id }),
      });
      messageBar.success("Created space successfully");
      onSuccess?.();
    } catch (error) {
      messageBar.error(error instanceof Error ? error.message : "Failed to create space");
    }
  };

  return (
    <MuiContainer component="form" onSubmit={form.handleSubmit(onSubmit)} disableGutters>
      <Grid2 spacing={2} container>
        <Grid2 size={12}>
          <TextField
            name="name"
            label="Name"
            form={form}
            placeholder="e.g. Marketing, Engineering, Client Delivery"
          />
        </Grid2>
        <Grid2 size={12}>
          <PrimaryButton type="submit" label="Create" />
        </Grid2>
      </Grid2>
    </MuiContainer>
  );
};
