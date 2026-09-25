import MoreVert from "@mui/icons-material/MoreVert";
import { IconButton } from "@mui/material";
import { useContext } from "react";
import { ItemDueDateCell } from "./ItemDueDateCell";
import { ItemNameCell } from "./ItemNameCell";
import { ItemPriorityCell } from "./ItemPriorityCell";
import { ItemStatusCell } from "./ItemStatusCell";
import { ItemListUiContext } from "./ItemListUiContext";

export const ItemStatusTableCell = ({
  itemId,
  statusId,
  statusName,
}: {
  itemId: string;
  statusId: string;
  statusName: string;
}) => {
  const ui = useContext(ItemListUiContext);
  if (!ui) return null;
  return (
    <ItemStatusCell
      itemId={itemId}
      statusId={statusId}
      statusName={statusName}
      statuses={ui.statuses}
      disabled={ui.isSaving}
      onChange={(nextStatusId) => {
        ui.onStatusChange(itemId, nextStatusId);
      }}
    />
  );
};

export const ItemNameTableCell = ({
  itemId,
  name,
  depth,
  hasChildren,
  isExpanded,
}: {
  itemId: string;
  name: string;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}) => {
  const ui = useContext(ItemListUiContext);
  if (!ui) return name;

  return (
    <ItemNameCell
      itemId={itemId}
      name={name}
      depth={depth}
      hasChildren={hasChildren}
      showExpandGutter={ui.showExpandGutter}
      isExpanded={isExpanded}
      isExpanding={ui.expandingItemIds.has(itemId)}
      isEditing={ui.editingItemId === itemId}
      isSaving={ui.isSaving}
      onStartEditing={() => ui.onStartEditing(itemId)}
      onFinishEditing={() => ui.onFinishEditing(itemId)}
      onSave={async (nextName) => ui.onSaveName(itemId, nextName)}
      onToggleExpand={() => {
        if (!hasChildren) return;
        ui.onToggleNestedItem(itemId);
      }}
    />
  );
};

export const ItemPriorityTableCell = ({ itemId, value }: { itemId: string; value: string }) => {
  const ui = useContext(ItemListUiContext);
  if (!ui) return value;
  const current = ui.priorityOverrides[itemId] ?? value;
  return (
    <ItemPriorityCell
      itemId={itemId}
      value={current}
      disabled={ui.isSaving}
      onChange={(nextPriority) => {
        ui.onPriorityChange(itemId, nextPriority);
      }}
    />
  );
};

export const ItemDueDateTableCell = ({
  itemId,
  value,
}: {
  itemId: string;
  value: string | null | undefined;
}) => {
  const ui = useContext(ItemListUiContext);
  const fallback = value ?? null;
  if (!ui) return fallback ?? "";
  const override = ui.dueDateOverrides[itemId];
  const current = override === undefined ? fallback : override;
  return (
    <ItemDueDateCell
      itemId={itemId}
      value={current}
      disabled={ui.isSaving}
      onChange={(nextDueDate) => {
        ui.onDueDateChange(itemId, nextDueDate);
      }}
    />
  );
};

export const ItemActionsTableCell = ({ itemId }: { itemId: string }) => {
  const ui = useContext(ItemListUiContext);
  if (!ui) return null;
  return (
    <IconButton
      size="small"
      aria-label="Item actions"
      onClick={(event) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        ui.onOpenMenu(itemId, { top: rect.bottom, left: rect.left });
      }}
    >
      <MoreVert fontSize="small" />
    </IconButton>
  );
};
