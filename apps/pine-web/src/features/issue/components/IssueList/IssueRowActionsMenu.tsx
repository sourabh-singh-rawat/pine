import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Menu, MenuItem } from "@pine/ui";

type IssueRowActionsMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onRename?: () => void;
};

export const IssueRowActionsMenu = ({
  anchorEl,
  open,
  onClose,
  onDelete,
  onRename,
}: IssueRowActionsMenuProps) => (
  <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
    <MenuItem
      leadingIcon={<EditOutlined fontSize="small" />}
      onClick={onRename}
      isDisabled={!onRename}
    >
      Rename
    </MenuItem>
    <MenuItem leadingIcon={<ArchiveOutlined fontSize="small" />} isDisabled>
      Archive
    </MenuItem>
    <MenuItem leadingIcon={<DeleteOutlineOutlined fontSize="small" />} onClick={onDelete}>
      Delete
    </MenuItem>
  </Menu>
);
