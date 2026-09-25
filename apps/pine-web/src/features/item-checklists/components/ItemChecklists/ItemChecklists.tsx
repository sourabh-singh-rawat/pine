import AddIcon from "@mui/icons-material/Add";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import MoreVert from "@mui/icons-material/MoreVert";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import {
  useCreateChecklistEntryMutation,
  useCreateChecklistMutation,
  useDeleteChecklistEntryMutation,
  useDeleteChecklistMutation,
  useGetChecklistsQuery,
  useUpdateChecklistEntryMutation,
  useUpdateChecklistMutation,
} from "@generated/gql";
import {
  Menu,
  MenuItem,
  MenuItemIcon,
  ProgressCircularIndicator,
  ProgressLinear,
  type MenuAnchorPosition,
} from "@pine/ui";
import { useSnackbar } from "@shared";
import { mapChecklists } from "./mapChecklist";

type ItemChecklistsProps = {
  itemId: string;
};

export const ItemChecklists = ({ itemId }: ItemChecklistsProps) => {
  const theme = useTheme();
  const snackbar = useSnackbar();
  const [newChecklistName, setNewChecklistName] = useState("");
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [entryDrafts, setEntryDrafts] = useState<Record<string, string>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [menuChecklistId, setMenuChecklistId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchorPosition | null>(null);
  const [busyEntryId, setBusyEntryId] = useState<string | null>(null);

  const checklistsQuery = useGetChecklistsQuery(
    { itemId },
    {
      enabled: Boolean(itemId),
      select: (data) => mapChecklists(data.getChecklists),
    },
  );
  const createChecklistMutation = useCreateChecklistMutation();
  const updateChecklistMutation = useUpdateChecklistMutation();
  const deleteChecklistMutation = useDeleteChecklistMutation();
  const createEntryMutation = useCreateChecklistEntryMutation();
  const updateEntryMutation = useUpdateChecklistEntryMutation();
  const deleteEntryMutation = useDeleteChecklistEntryMutation();

  const checklists = checklistsQuery.data ?? [];
  const isMutating =
    createChecklistMutation.isPending ||
    updateChecklistMutation.isPending ||
    deleteChecklistMutation.isPending ||
    createEntryMutation.isPending ||
    updateEntryMutation.isPending ||
    deleteEntryMutation.isPending;

  const refresh = async () => {
    await checklistsQuery.refetch();
  };

  const handleCreateChecklist = async () => {
    const name = newChecklistName.trim();
    if (name.length === 0) {
      snackbar.error("Checklist name is required");
      return;
    }

    try {
      await createChecklistMutation.mutateAsync({
        input: { itemId, name },
      });
      setNewChecklistName("");
      setIsAddingChecklist(false);
      snackbar.success("Checklist created");
      await refresh();
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to create checklist");
    }
  };

  const handleRenameChecklist = async (checklistId: string) => {
    const name = renameValue.trim();
    if (name.length === 0) {
      snackbar.error("Checklist name is required");
      return;
    }

    try {
      await updateChecklistMutation.mutateAsync({
        input: { id: checklistId, name },
      });
      setRenamingId(null);
      setRenameValue("");
      snackbar.success("Checklist renamed");
      await refresh();
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to rename checklist");
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    try {
      await deleteChecklistMutation.mutateAsync({ id: checklistId });
      snackbar.success("Checklist deleted");
      await refresh();
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to delete checklist");
    }
  };

  const handleAddEntry = async (checklistId: string) => {
    const title = (entryDrafts[checklistId] ?? "").trim();
    if (title.length === 0) {
      snackbar.error("Entry title is required");
      return;
    }

    try {
      await createEntryMutation.mutateAsync({
        input: { checklistId, title },
      });
      setEntryDrafts((current) => ({ ...current, [checklistId]: "" }));
      await refresh();
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to add entry");
    }
  };

  const handleToggleEntry = async (entryId: string, completed: boolean) => {
    setBusyEntryId(entryId);
    try {
      await updateEntryMutation.mutateAsync({
        input: { id: entryId, completed },
      });
      await refresh();
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to update entry");
    } finally {
      setBusyEntryId(null);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    setBusyEntryId(entryId);
    try {
      await deleteEntryMutation.mutateAsync({ id: entryId });
      await refresh();
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to delete entry");
    } finally {
      setBusyEntryId(null);
    }
  };

  const closeMenu = () => {
    setMenuChecklistId(null);
    setMenuAnchor(null);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body1" fontWeight="600">
          Checklists
        </Typography>
        {!isAddingChecklist && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            disabled={isMutating}
            onClick={() => {
              setIsAddingChecklist(true);
            }}
          >
            Add checklist
          </Button>
        )}
      </Stack>

      {isAddingChecklist && (
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            fullWidth
            autoFocus
            label="Checklist name"
            value={newChecklistName}
            onChange={(event) => {
              setNewChecklistName(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreateChecklist();
              }
              if (event.key === "Escape") {
                setIsAddingChecklist(false);
                setNewChecklistName("");
              }
            }}
          />
          <Button
            variant="contained"
            size="small"
            disabled={createChecklistMutation.isPending}
            onClick={() => {
              void handleCreateChecklist();
            }}
          >
            Create
          </Button>
          <Button
            size="small"
            disabled={createChecklistMutation.isPending}
            onClick={() => {
              setIsAddingChecklist(false);
              setNewChecklistName("");
            }}
          >
            Cancel
          </Button>
        </Stack>
      )}

      {checklistsQuery.isPending && (
        <ProgressCircularIndicator size={32} aria-label="Loading checklists" />
      )}

      {checklistsQuery.isError && (
        <Typography variant="body2" color="error">
          Failed to load checklists.
        </Typography>
      )}

      {checklistsQuery.isSuccess && checklists.length === 0 && !isAddingChecklist && (
        <Typography variant="body2" color="text.secondary">
          No checklists yet.
        </Typography>
      )}

      {checklists.map((checklist) => {
        const progress =
          checklist.totalCount === 0 ? 0 : (checklist.completedCount / checklist.totalCount) * 100;
        const entryDraft = entryDrafts[checklist.id] ?? "";
        const isRenaming = renamingId === checklist.id;

        return (
          <Stack
            key={checklist.id}
            spacing={1.5}
            sx={{
              px: 1.5,
              py: 1.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              {isRenaming ? (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    autoFocus
                    value={renameValue}
                    onChange={(event) => {
                      setRenameValue(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleRenameChecklist(checklist.id);
                      }
                      if (event.key === "Escape") {
                        setRenamingId(null);
                        setRenameValue("");
                      }
                    }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    disabled={updateChecklistMutation.isPending}
                    onClick={() => {
                      void handleRenameChecklist(checklist.id);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    disabled={updateChecklistMutation.isPending}
                    onClick={() => {
                      setRenamingId(null);
                      setRenameValue("");
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {checklist.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {checklist.completedCount}/{checklist.totalCount}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    aria-label={`Checklist actions for ${checklist.name}`}
                    disabled={isMutating}
                    onClick={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      setMenuChecklistId(checklist.id);
                      setMenuAnchor({ top: rect.bottom, left: rect.left });
                    }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </>
              )}
            </Stack>

            {checklist.totalCount > 0 && <ProgressLinear variant="determinate" value={progress} />}

            <Stack spacing={0.5}>
              {checklist.entries.map((entry) => (
                <Stack key={entry.id} direction="row" spacing={0.5} alignItems="center">
                  <Checkbox
                    size="small"
                    checked={entry.completed}
                    disabled={busyEntryId === entry.id || isMutating}
                    onChange={(_event, checked) => {
                      void handleToggleEntry(entry.id, checked);
                    }}
                    inputProps={{
                      "aria-label": `Mark ${entry.title} ${entry.completed ? "incomplete" : "complete"}`,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      textDecoration: entry.completed ? "line-through" : "none",
                      color: entry.completed ? "text.secondary" : "text.primary",
                    }}
                  >
                    {entry.title}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={`Delete ${entry.title}`}
                    disabled={busyEntryId === entry.id || isMutating}
                    onClick={() => {
                      void handleDeleteEntry(entry.id);
                    }}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                placeholder="Add an item"
                value={entryDraft}
                disabled={isMutating}
                onChange={(event) => {
                  const value = event.target.value;
                  setEntryDrafts((current) => ({
                    ...current,
                    [checklist.id]: value,
                  }));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleAddEntry(checklist.id);
                  }
                }}
              />
              <Button
                size="small"
                startIcon={<AddIcon />}
                disabled={isMutating || entryDraft.trim().length === 0}
                onClick={() => {
                  void handleAddEntry(checklist.id);
                }}
              >
                Add
              </Button>
            </Stack>
          </Stack>
        );
      })}

      <Menu
        anchorPosition={menuAnchor}
        open={Boolean(menuChecklistId && menuAnchor)}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={() => {
            const checklist = checklists.find((row) => row.id === menuChecklistId);
            if (checklist) {
              setRenamingId(checklist.id);
              setRenameValue(checklist.name);
            }
            closeMenu();
          }}
        >
          <MenuItemIcon>
            <EditOutlined fontSize="small" />
          </MenuItemIcon>
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuChecklistId) {
              void handleDeleteChecklist(menuChecklistId);
            }
            closeMenu();
          }}
        >
          <MenuItemIcon>
            <DeleteOutline fontSize="small" />
          </MenuItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Stack>
  );
};
