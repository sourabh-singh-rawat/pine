import Add from "@mui/icons-material/Add";
import { Box, Chip, IconButton, Stack, Tooltip } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type MouseEvent } from "react";
import { useCreateTagMutation, useGetTagsQuery, useSetItemTagsMutation } from "@generated/gql";
import { useWorkspaceStore } from "@features/workspace/store";
import { TagPickerPopover, type TagItem } from "../ItemTagSelector";
import type { ItemRowTag } from "./types";

export interface ItemTagsCellProps {
  itemId: string;
  tags?: ItemRowTag[];
}

const VISIBLE_TAG_LIMIT = 2;
const PRESET_COLORS: string[] = [
  "#3B82F6",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#F59E0B",
  "#64748B",
];

export const ItemTagsCell = ({ itemId, tags = [] }: ItemTagsCellProps) => {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");

  const tagsQuery = useGetTagsQuery(
    { input: { workspaceId: workspaceId ?? "" } },
    { enabled: Boolean(workspaceId) },
  );

  const createTagMutation = useCreateTagMutation();
  const setItemTagsMutation = useSetItemTagsMutation();

  const allTags: TagItem[] = (tagsQuery.data?.getTags ?? []).flatMap((tag) =>
    tag && tag.id && tag.name && tag.color
      ? [{ id: tag.id, name: tag.name, color: tag.color }]
      : [],
  );

  const selectedTagIds = tags.map((t) => t.id);
  const visibleTags = tags.slice(0, VISIBLE_TAG_LIMIT);
  const remainingTags = tags.slice(VISIBLE_TAG_LIMIT);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
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
      queryKey: ["GetListItems"],
    });
    void queryClient.invalidateQueries({
      queryKey: ["GetSubItems"],
    });
  };

  const handleToggleTag = async (tagId: string) => {
    const isSelected = selectedTagIds.includes(tagId);
    const nextTagIds = isSelected
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
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

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
      }}
      sx={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", py: 0.5 }}>
        {visibleTags.map((tag) => (
          <Chip
            key={tag.id}
            size="small"
            label={tag.name}
            onClick={handleOpen}
            sx={{
              height: 20,
              fontSize: "0.7rem",
              fontWeight: 500,
              color: tag.color,
              backgroundColor: `${tag.color}18`,
              borderColor: `${tag.color}40`,
              borderWidth: 1,
              borderStyle: "solid",
              cursor: "pointer",
            }}
          />
        ))}

        {remainingTags.length > 0 && (
          <Tooltip
            title={
              <Stack spacing={0.5} sx={{ p: 0.5 }}>
                {remainingTags.map((tag) => (
                  <Stack key={tag.id} direction="row" spacing={0.75} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: tag.color,
                      }}
                    />
                    <span>{tag.name}</span>
                  </Stack>
                ))}
              </Stack>
            }
            arrow
          >
            <Chip
              size="small"
              label={`+${remainingTags.length}`}
              onClick={handleOpen}
              sx={{
                height: 20,
                fontSize: "0.7rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            />
          </Tooltip>
        )}

        <IconButton
          size="small"
          onClick={handleOpen}
          aria-label="Add tag"
          sx={{
            width: 20,
            height: 20,
            opacity: tags.length === 0 ? 0.6 : 0.4,
            "&:hover": {
              opacity: 1,
            },
          }}
        >
          <Add sx={{ fontSize: 13 }} />
        </IconButton>
      </Stack>

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
