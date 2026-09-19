import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteIssueMutation,
  useFindProjectIssuesQuery,
  useFindSubIssuesQuery,
} from "@generated/gql";
import { DataGrid, Link, useSnackbar } from "@shared";

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

export const IssueList = ({ issueId, projectId, style }: IssueListProps) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const deleteIssueMutation = useDeleteIssueMutation();
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

  const handleDelete = async (id: GridRowId) => {
    try {
      const response = await deleteIssueMutation.mutateAsync({ id: String(id) });
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
      snackbar.success(response.deleteIssue ?? "Issue deleted");
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to delete issue");
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
    { field: "priority", headerName: "Priority" },
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
