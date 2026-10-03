import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, IconButton, InputBase, useTheme } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@pine/ui";
import { useCreateItemMutation, useGetListItemsQuery } from "@generated/gql";
import { useSnackbar } from "@shared";
import { AddItemModal } from "../AddItemModal";

const DEFAULT_ITEM_PRIORITY = "Normal";

export interface GroupAddItemRowProps {
  listId: string;
  statusId: string;
}

export const GroupAddItemRow = ({ listId, statusId }: GroupAddItemRowProps) => {
  const theme = useTheme();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createItemMutation = useCreateItemMutation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");

  const handleCancel = () => {
    setIsCreating(false);
    setName("");
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || createItemMutation.isPending) {
      return;
    }
    try {
      await createItemMutation.mutateAsync({
        input: {
          name: trimmed,
          type: "issue",
          listId,
          statusId,
          priority: DEFAULT_ITEM_PRIORITY,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: useGetListItemsQuery.getKey({ listId }),
      });
      setName("");
      snackbar.success("Item created successfully");
      inputRef.current?.focus();
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to create item");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSave();
    } else if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
  };

  return (
    <>
      <Box sx={{ mt: 0.5, px: 1 }}>
        {isCreating ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 0.5,
              px: 1,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <AddIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, flexShrink: 0 }} />
            <InputBase
              inputRef={inputRef}
              autoFocus
              fullWidth
              placeholder="Item name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={createItemMutation.isPending}
              sx={{
                fontSize: "0.875rem",
                px: 0.5,
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
              <Button
                size="small"
                variant="contained"
                label={createItemMutation.isPending ? "Saving…" : "Save"}
                isDisabled={createItemMutation.isPending || !name.trim()}
                onClick={() => {
                  void handleSave();
                }}
              />
              <Button
                size="small"
                variant="text"
                label="Cancel"
                isDisabled={createItemMutation.isPending}
                onClick={handleCancel}
              />
              <IconButton
                size="small"
                title="Open in modal"
                aria-label="Open in modal"
                onClick={() => setIsModalOpen(true)}
                disabled={createItemMutation.isPending}
                sx={{ color: theme.palette.text.secondary }}
              >
                <OpenInNewIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Box
            component="button"
            type="button"
            onClick={() => setIsCreating(true)}
            sx={{
              all: "unset",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              color: theme.palette.text.secondary,
              fontSize: "0.8125rem",
              fontWeight: 500,
              transition: theme.transitions.create(["background-color", "color"], {
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
              "&:focus-visible": {
                outline: `2px solid ${theme.palette.primary.main}`,
              },
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
            <span>Add item</span>
          </Box>
        )}
      </Box>
      <AddItemModal
        listId={listId}
        defaultStatusId={statusId}
        type="issue"
        defaultName={name}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsCreating(false);
          setName("");
        }}
        hideTrigger
      />
    </>
  );
};
