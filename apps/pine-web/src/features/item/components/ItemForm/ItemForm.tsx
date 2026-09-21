import { Grid2 } from "@mui/material";
import MuiContainer from "@mui/material/Container";
import dayjs from "dayjs";
import { SubmitHandler, useForm } from "react-hook-form";
import type { CreateItemInput } from "@generated/gql/graphql";
import { useCreateItemMutation } from "@generated/gql";
import { DatePicker, PrimaryButton, TextField, useSnackbar } from "@shared";
import { ItemPrioritySelector } from "../ItemPrioritySelector";
import { ItemStatusSelector } from "../ItemStatusSelector";

interface ItemFormProps {
  projectId: string;
  parentItemId?: string;
}

export const ItemForm = ({ projectId, parentItemId }: ItemFormProps) => {
  const messageBar = useSnackbar();
  const createItemMutation = useCreateItemMutation();

  const form = useForm<CreateItemInput>({
    defaultValues: {
      projectId,
      parentItemId,
      description: "",
      statusId: "",
      priority: "",
      dueDate: null,
      assigneeIds: [],
      estimate: undefined,
      component: "",
    },
    mode: "all",
  });
  const onSubmit: SubmitHandler<CreateItemInput> = async ({
    name,
    description,
    projectId: formProjectId,
    parentItemId: formParentItemId,
    assigneeIds,
    priority,
    statusId,
    dueDate,
    estimate,
    component,
  }) => {
    try {
      await createItemMutation.mutateAsync({
        input: {
          parentItemId: formParentItemId,
          projectId: formProjectId,
          name,
          description,
          type: "item",
          assigneeIds,
          statusId,
          priority,
          dueDate: dueDate ? dayjs(dueDate).format() : null,
          estimate: estimate ? Number(estimate) : null,
          component: component || null,
        },
      });
      messageBar.success("Item created successfully");
    } catch (error) {
      messageBar.error(error instanceof Error ? error.message : "Failed to create item");
    }
  };

  return (
    <MuiContainer component="form" onSubmit={form.handleSubmit(onSubmit)} disableGutters>
      <Grid2 container spacing={2}>
        <Grid2 size={12}>
          <TextField form={form} name="name" label="Name" placeholder="Name" />
        </Grid2>

        <Grid2 size={12}>
          <TextField
            form={form}
            name="description"
            label="Description"
            placeholder="Description"
            rows={4}
          />
        </Grid2>

        <Grid2 size={6}>
          <ItemStatusSelector form={form} name="statusId" title="Status" projectId={projectId} />
        </Grid2>

        <Grid2 size={6}>
          <ItemPrioritySelector
            form={form}
            name="priority"
            title="Priority"
            options={["Urgent", "High", "Medium", "Low"]}
          />
        </Grid2>
        <Grid2 size={6}>
          <DatePicker name="dueDate" title="Due Date" form={form} />
        </Grid2>
        <Grid2 size={6}>
          <TextField
            form={form}
            name="estimate"
            label="Estimate"
            placeholder="Estimate (hours/points)"
            type="number"
          />
        </Grid2>
        <Grid2 size={12}>
          <TextField form={form} name="component" label="Component" placeholder="Component name" />
        </Grid2>
        <Grid2 size={6}>
          <PrimaryButton label="Create Item" type="submit" />
        </Grid2>
      </Grid2>
    </MuiContainer>
  );
};
