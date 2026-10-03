import Add from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import {
  Box,
  ButtonBase,
  InputAdornment,
  MenuItem,
  MenuList,
  Popover,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { TagItem } from "./types";

export interface TagPickerPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  search: string;
  allTags: TagItem[];
  selectedTagIds: string[];
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onToggleTag: (tagId: string) => void;
  onCreateTag: () => void;
}

export const TagPickerPopover = ({
  open,
  anchorEl,
  search,
  allTags,
  selectedTagIds,
  onClose,
  onSearchChange,
  onToggleTag,
  onCreateTag,
}: TagPickerPopoverProps) => {
  const theme = useTheme();

  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const canCreate =
    search.trim().length > 0 &&
    !allTags.some((tag) => tag.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      slotProps={{
        paper: {
          sx: {
            width: 260,
            p: 1.5,
            borderRadius: 2,
            boxShadow: theme.shadows[4],
          },
        },
      }}
    >
      <Stack spacing={1}>
        <TextField
          autoFocus
          size="small"
          placeholder="Search or create tag…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCreateTag();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocalOfferOutlined sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
        />

        <MenuList sx={{ p: 0, maxHeight: 200, overflowY: "auto" }}>
          {filteredTags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <MenuItem
                key={tag.id}
                onClick={() => onToggleTag(tag.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 1,
                  py: 0.75,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: tag.color,
                    }}
                  />
                  <Typography variant="body2">{tag.name}</Typography>
                </Stack>
                {isSelected && <Check sx={{ fontSize: 16, color: theme.palette.primary.main }} />}
              </MenuItem>
            );
          })}

          {canCreate && (
            <ButtonBase
              onClick={onCreateTag}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                justifyContent: "flex-start",
                color: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Add sx={{ fontSize: 16 }} />
              <Typography variant="body2">Create &quot;{search.trim()}&quot;</Typography>
            </ButtonBase>
          )}
        </MenuList>
      </Stack>
    </Popover>
  );
};
