import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Box } from "@mui/material";
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  useDeleteIssueMutation,
  useFindIssueQuery,
  useFindProjectIssuesQuery,
  useFindSubIssuesQuery,
  useUpdateIssueMutation,
} from "@generated/gql";
import { DataGrid, Link, Select, useSnackbar } from "@shared";

interface IssueListProps {
  issueId?: string;
  projectId?: string;
  filters?: IssueListFilters;
  style?: IssueListStyles;
}

interface IssueListFilters {}

interface IssueListStyles {
  showBorder?: boolean;
}

const PRIORITY_OPTIONS = ["Urgent", "High", "Normal", "Low"];

const prioritySelectOptions = PRIORITY_OPTIONS.map((option) => ({
  id: option,
  name: option,
}));

export const IssueList = ({ issueId, projectId, style }: IssueListProps) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const deleteIssueMutation = useDeleteIssueMutation();
  const updateIssueMutation = useUpdateIssueMutation();
  const [priorityOverrides, setPriorityOverrides] = useState<Record<string, string>>({});
  const projectIssues = useFindProjectIssuesQuery(
    { projectId: projectId! },
    {
      select: (data) => data.findProjectIssues,
      enabled: Boolean(projectId) && !issueId,
    },
  );
  const subIssues = useFindSubIssuesQuery(
    { input: { parentIssueId: issueId! } },
    {
      select: (data) => data.findSubIssues,
      enabled: Boolean(issueId),
    },
  );
  const rows: GridValidRowModel[] = issueId ? (subIssues.data ?? []) : (projectIssues.data ?? []);

  const invalidateIssueLists = async () => {
    if (projectId) {
      await queryClient.invalidateQueries({
        queryKey: useFindProjectIssuesQuery.getKey({ projectId }),
      });
    }
    if (issueId) {
      await queryClient.invalidateQueries({
        queryKey: useFindSubIssuesQuery.getKey({ input: { parentIssueId: issueId } }),
      });
    }
  };

  const handleDelete = async (id: GridRowId) => {
    try {
      const response = await deleteIssueMutation.mutateAsync({ id: String(id) });
      await invalidateIssueLists();
      snackbar.success(response.deleteIssue ?? "Issue deleted");
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to delete issue");
    }
  };

  const handlePriorityChange = async (id: GridRowId, priority: string) => {
    const issueKey = String(id);
    setPriorityOverrides((current) => ({ ...current, [issueKey]: priority }));
    try {
      const response = await updateIssueMutation.mutateAsync({
        input: { issueId: issueKey, priority },
      });
      await invalidateIssueLists();
      await queryClient.invalidateQueries({
        queryKey: useFindIssueQuery.getKey({ findIssueId: issueKey }),
      });
      setPriorityOverrides((current) => {
        const next = { ...current };
        delete next[issueKey];
        return next;
      });
      snackbar.success(response.updateIssue ?? "Issue updated");
    } catch (error) {
      setPriorityOverrides((current) => {
        const next = { ...current };
        delete next[issueKey];
        return next;
      });
      snackbar.error(error instanceof Error ? error.message : "Failed to update issue");
    }
  };

  const columns: GridColDef<GridValidRowModel>[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      type: "text",
      renderCell({ id, value }: GridRenderCellParams) {
        return <Link to={`/i/${id}`}>{value}</Link>;
      },
    },
    { field: "dueDate", headerName: "Due Date" },
    {
      field: "priority",
      headerName: "Priority",
      width: 140,
      sortable: false,
      renderCell({ id, value }: GridRenderCellParams) {
        const issueKey = String(id);
        const current =
          priorityOverrides[issueKey] ?? (typeof value === "string" ? value : "");
        return (
          <Box
            onClick={(event) => {
              event.stopPropagation();
            }}
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Select
              name={`priority-${issueKey}`}
              value={current}
              variant="small"
              options={prioritySelectOptions}
              isDisabled={updateIssueMutation.isPending}
              onChange={(event) => {
                const next = event.target.value;
                if (typeof next !== "string" || !next || next === current) return;
                void handlePriorityChange(id, next);
              }}
            />
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      type: "actions",
      getActions({ id }) {
        return [
          <GridActionsCellItem
            key="rename"
            label="Rename"
            icon={<EditOutlined fontSize="small" />}
            showInMenu
          />,
          <GridActionsCellItem
            key="archive"
            label="Archive"
            icon={<ArchiveOutlined fontSize="small" />}
            showInMenu
          />,
          <GridActionsCellItem
            key="delete"
            label="Delete"
            icon={<DeleteOutlineOutlined fontSize="small" />}
            showInMenu
            onClick={() => {
              void handleDelete(id);
            }}
          />,
        ];
      },
    },
  ];

  return <DataGrid rows={rows} columns={columns} hideFooter showBorder={style?.showBorder} />;
};
