import ArrowBack from "@mui/icons-material/ArrowBack";
import { Grid2, IconButton, Typography, useTheme } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useGetItemQuery, useUpdateItemMutation } from "@generated/gql";
import type { UpdateItemInput } from "@generated/gql/graphql";
import { AppBar } from "@pine/ui";
import { useItemParams, useSnackbar } from "@shared";
import { ItemAttachments } from "@features/item-attachments";
import { ItemChecklists } from "@features/item-checklists";
import { ItemSubItems } from "@features/item-sub-items";
import { ItemActivity, ItemDescription, ItemFields, ItemName } from "../../components";

export const ItemPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { itemId } = useItemParams();
  const itemQuery = useGetItemQuery(
    { id: itemId },
    {
      select: (data) => data.getItem ?? null,
    },
  );
  const updateItemMutation = useUpdateItemMutation();

  const updateItem = async (input: UpdateItemInput) => {
    try {
      const response = await updateItemMutation.mutateAsync({ input });
      snackbar.success(response.updateItem ?? "Item updated");
      return response;
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to update item");
      throw error;
    }
  };

  const item = itemQuery.data;
  const listId = item?.list?.id ?? undefined;
  const listName = item?.list?.name ?? undefined;
  const itemName = item?.name ?? undefined;
  const itemDescription = item?.description ?? undefined;
  const statusId = item?.statusId ?? undefined;
  const priority = item?.priority ?? undefined;
  const resolvedItemId = item?.id ?? undefined;

  const handleBackToList = () => {
    if (!listId) return;
    void navigate({ to: "/v/l/$viewId", params: { viewId: listId } });
  };

  return (
    <Grid2 container rowGap={4} sx={{ px: theme.spacing(4) }}>
      <Grid2 size={12}>
        <AppBar
          leading={
            <IconButton aria-label="Back to list" onClick={handleBackToList} disabled={!listId}>
              <ArrowBack />
            </IconButton>
          }
          title={<ItemName itemId={itemId} initialValue={itemName} />}
          subtitle={listName}
        />
      </Grid2>
      {item && itemId && listId && statusId && priority && (
        <Grid2 size={12}>
          <ItemFields
            itemId={itemId}
            listId={listId}
            statusId={statusId}
            priority={priority}
            updateItem={updateItem}
          />
        </Grid2>
      )}

      <Grid2 size={12}>
        <ItemDescription itemId={itemId} initialValue={itemDescription} />
      </Grid2>

      <Grid2 size={12}>
        <Typography variant="body1" fontWeight="600">
          Custom Fields
        </Typography>
      </Grid2>

      {listId && resolvedItemId && (
        <Grid2 size={12}>
          <ItemSubItems listId={listId} itemId={resolvedItemId} />
        </Grid2>
      )}

      {itemId && (
        <Grid2 size={12}>
          <ItemChecklists itemId={itemId} />
        </Grid2>
      )}

      {itemId && (
        <Grid2 size={12}>
          <Typography variant="body1" fontWeight="600">
            Attachments
          </Typography>

          <ItemAttachments itemId={itemId} />
        </Grid2>
      )}

      {itemId && (
        <Grid2 size={12}>
          <ItemActivity itemId={itemId} />
        </Grid2>
      )}
    </Grid2>
  );
};
