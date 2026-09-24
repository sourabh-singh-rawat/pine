import MuiContainer from "@mui/material/Container";
import Grid2 from "@mui/material/Grid2";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import type { CreateListInput } from "@generated/gql/graphql";
import { useCreateListMutation, useGetListsQuery } from "@generated/gql";
import { PrimaryButton, TextField, useSnackbar } from "@shared";

type ListFormValues = {
  name: string;
};

type ListFormProps = {
  spaceId: string;
  onSuccess?: () => void;
};

export const ListForm = ({ spaceId, onSuccess }: ListFormProps) => {
  const messageBar = useSnackbar();
  const queryClient = useQueryClient();
  const createListMutation = useCreateListMutation();

  const defaultValues: ListFormValues = useMemo(() => ({ name: "" }), []);
  const form = useForm({
    defaultValues,
    mode: "all",
  });

  const onSubmit: SubmitHandler<ListFormValues> = async ({ name }) => {
    const input: CreateListInput = {
      spaceId,
      name,
    };

    try {
      await createListMutation.mutateAsync({ input });
      await queryClient.invalidateQueries({
        queryKey: useGetListsQuery.getKey({ spaceId }),
      });
      messageBar.success("Created list successfully");
      onSuccess?.();
    } catch (error) {
      messageBar.error(error instanceof Error ? error.message : "Failed to create list");
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
            placeholder="e.g. Unity Game, Tools, Website"
          />
        </Grid2>
        <Grid2 size={12}>
          <PrimaryButton type="submit" label="Create" />
        </Grid2>
      </Grid2>
    </MuiContainer>
  );
};
