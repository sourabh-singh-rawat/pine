import { Stack, Typography } from "@mui/material";
import { ItemList, ItemModal } from "@features/item";

type ItemSubItemsProps = {
  listId: string;
  itemId: string;
};

export const ItemSubItems = ({ listId, itemId }: ItemSubItemsProps) => {
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body1" fontWeight="600">
          Sub Items
        </Typography>
        <ItemModal listId={listId} />
      </Stack>
      <ItemList itemId={itemId} style={{ showBorder: true }} />
    </Stack>
  );
};
