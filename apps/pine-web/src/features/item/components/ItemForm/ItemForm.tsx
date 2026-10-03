import { Grid2 } from "@mui/material";
import MuiContainer from "@mui/material/Container";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { SubmitHandler, useForm } from "react-hook-form";
import type { CreateItemInput } from "@generated/gql/graphql";
import { useCreateItemMutation, useGetListItemsQuery, useGetSubItemsQuery } from "@generated/gql";
import { DatePicker, TextField, useSnackbar } from "@shared";
import { ItemPrioritySelector } from "../ItemPrioritySelector";
import { ItemStatusSelector } from "../ItemStatusSelector";

const DEFAULT_ITEM_PRIORITY = "Normal";

interface ItemFormProps {
  listId: string;
  parentItemId?: string;
  formId: string;
  defaultStatusId?: string;
  type?: string;
  defaultName?: string;
  onSuccess?: () => void;
}

export const ItemForm = ({
  listId,
  parentItemId,
  formId,
  defaultStatusId,
  type = "issue",
  defaultName = "",
  onSuccess,
}: ItemFormProps) => {
  const queryClient = useQueryClient();
  const messageBar = useSnackbar();
  const createItemMutation = useCreateItemMutation();

  const form = useForm<CreateItemInput>({
    defaultValues: {
      name: defaultName,
      listId,
      parentItemId,
      description: "",
      statusId: defaultStatusId ?? "",
      priority: DEFAULT_ITEM_PRIORITY,
      dueDate: null,
      estimate: undefined,
      component: "",
    },
    mode: "all",
  });
  const onSubmit: SubmitHandler<CreateItemInput> = async ({
    name,
    description,
    listId: formListId,
    parentItemId: formParentItemId,
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
          listId: formListId,
          name,
          description,
          type,
          statusId,
          priority,
          dueDate: dueDate ? dayjs(dueDate).format() : null,
          estimate: estimate ? Number(estimate) : null,
          component: component || null,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: useGetListItemsQuery.getKey({ listId: formListId }),
      });
      if (formParentItemId) {
        await queryClient.invalidateQueries({
          queryKey: useGetSubItemsQuery.getKey({ input: { parentItemId: formParentItemId } }),
        });
      }
      messageBar.success("Item created successfully");
      onSuccess?.();
    } catch (error) {
      messageBar.error(error instanceof Error ? error.message : "Failed to create item");
    }
  };

  return (
    <MuiContainer
      id={formId}
      component="form"
      onSubmit={form.handleSubmit(onSubmit)}
      disableGutters
    >
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
          <ItemStatusSelector form={form} name="statusId" title="Status" listId={listId} />
        </Grid2>

        <Grid2 size={6}>
          <ItemPrioritySelector
            form={form}
            name="priority"
            title="Priority"
            options={["Urgent", "High", "Normal", "Low"]}
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
      </Grid2>
    </MuiContainer>
  );
};
