import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";

type IssueRowActionsMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
};

export const IssueRowActionsMenu = ({
  anchorEl,
  open,
  onClose,
  onDelete,
}: IssueRowActionsMenuProps) => (
  <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
    <MenuItem disabled>
      <ListItemIcon>
        <EditOutlined fontSize="small" />
      </ListItemIcon>
      <ListItemText>Rename</ListItemText>
    </MenuItem>
    <MenuItem disabled>
      <ListItemIcon>
        <ArchiveOutlined fontSize="small" />
      </ListItemIcon>
      <ListItemText>Archive</ListItemText>
    </MenuItem>
    <MenuItem onClick={onDelete}>
      <ListItemIcon>
        <DeleteOutlineOutlined fontSize="small" />
      </ListItemIcon>
      <ListItemText>Delete</ListItemText>
    </MenuItem>
  </Menu>
);
