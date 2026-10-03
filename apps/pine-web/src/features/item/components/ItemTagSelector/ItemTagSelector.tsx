import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import { Box, Chip, CircularProgress, IconButton, Typography, useTheme } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type MouseEvent } from "react";
import {
  useCreateTagMutation,
  useGetItemTagsQuery,
  useGetTagsQuery,
  useSetItemTagsMutation,
} from "@generated/gql";
import { useWorkspaceStore } from "@features/workspace/store";
import { TagPickerPopover } from "./TagPickerPopover";
import type { ItemTagSelectorProps, TagItem } from "./types";

const PRESET_COLORS: string[] = [
  "#3B82F6",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#F59E0B",
  "#64748B",
];

export const ItemTagSelector = ({ itemId }: ItemTagSelectorProps) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");

  const tagsQuery = useGetTagsQuery(
    { input: { workspaceId: workspaceId ?? "" } },
    { enabled: Boolean(workspaceId) },
  );

  const itemTagsQuery = useGetItemTagsQuery({ itemId }, { enabled: Boolean(itemId) });

  const createTagMutation = useCreateTagMutation();
  const setItemTagsMutation = useSetItemTagsMutation();

  const rawAllTags = tagsQuery.data?.getTags;
  const allTags: TagItem[] = (rawAllTags ?? []).flatMap((t) =>
    t && t.id && t.name && t.color ? [{ id: t.id, name: t.name, color: t.color }] : [],
  );

  const rawSelectedTags = itemTagsQuery.data?.getItemTags;
  const selectedTags: TagItem[] = (rawSelectedTags ?? []).flatMap((t) =>
    t && t.id && t.name && t.color ? [{ id: t.id, name: t.name, color: t.color }] : [],
  );
  const selectedTagIds = selectedTags.map((tag) => tag.id);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setSearch("");
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const syncTags = async (nextTagIds: string[]) => {
    await setItemTagsMutation.mutateAsync({
      input: { itemId, tagIds: nextTagIds },
    });
    void queryClient.invalidateQueries({
      queryKey: useGetItemTagsQuery.getKey({ itemId }),
    });
  };

  const handleToggleTag = async (tagId: string) => {
    const isSelected = selectedTagIds.includes(tagId);
    const nextTagIds = isSelected
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    await syncTags(nextTagIds);
  };

  const handleRemoveTag = async (tagId: string, event: MouseEvent) => {
    event.stopPropagation();
    const nextTagIds = selectedTagIds.filter((id) => id !== tagId);
    await syncTags(nextTagIds);
  };

  const handleCreateTag = async () => {
    const trimmed = search.trim();
    if (!trimmed || !workspaceId) return;

    const existing = allTags.find((tag) => tag.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        await handleToggleTag(existing.id);
      }
      setSearch("");
      return;
    }

    const colorIndex = allTags.length % PRESET_COLORS.length;
    const color = PRESET_COLORS[colorIndex] ?? "#3B82F6";

    const response = await createTagMutation.mutateAsync({
      input: {
        workspaceId,
        name: trimmed,
        color,
      },
    });

    void queryClient.invalidateQueries({
      queryKey: useGetTagsQuery.getKey({ input: { workspaceId } }),
    });

    const createdTag = response.createTag;
    if (createdTag?.id) {
      await syncTags([...selectedTagIds, createdTag.id]);
    }

    setSearch("");
  };

  const isOpen = Boolean(anchorEl);
  const isUpdating = setItemTagsMutation.isPending || createTagMutation.isPending;

  return (
    <Box>
      <Box
        onClick={handleOpen}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          alignItems: "center",
          minHeight: 36,
          cursor: "pointer",
          borderRadius: 1,
          px: 1,
          py: 0.5,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        {itemTagsQuery.isPending && selectedTags.length === 0 ? (
          <CircularProgress size={16} />
        ) : selectedTags.length === 0 ? (
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Empty
          </Typography>
        ) : (
          selectedTags.map((tag) => (
            <Chip
              key={tag.id}
              size="small"
              label={tag.name}
              onDelete={(event) => {
                void handleRemoveTag(tag.id, event);
              }}
              deleteIcon={<Close sx={{ fontSize: 14 }} />}
              sx={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: tag.color,
                backgroundColor: `${tag.color}18`,
                borderColor: `${tag.color}40`,
                borderWidth: 1,
                borderStyle: "solid",
                "& .MuiChip-deleteIcon": {
                  color: tag.color,
                  "&:hover": {
                    color: tag.color,
                  },
                },
              }}
            />
          ))
        )}

        <IconButton
          size="small"
          disabled={isUpdating}
          onClick={handleOpen}
          sx={{
            width: 24,
            height: 24,
            border: `1px dashed ${theme.palette.divider}`,
            color: theme.palette.text.secondary,
            ml: selectedTags.length > 0 ? 0.5 : 0,
          }}
        >
          {isUpdating ? <CircularProgress size={12} /> : <Add sx={{ fontSize: 14 }} />}
        </IconButton>
      </Box>

      <TagPickerPopover
        open={isOpen}
        anchorEl={anchorEl}
        search={search}
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        onClose={handleClose}
        onSearchChange={setSearch}
        onToggleTag={(tagId) => {
          void handleToggleTag(tagId);
        }}
        onCreateTag={() => {
          void handleCreateTag();
        }}
      />
    </Box>
  );
};
