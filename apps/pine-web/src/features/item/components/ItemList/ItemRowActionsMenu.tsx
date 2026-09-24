import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Menu, MenuItem, MenuItemIcon, type MenuAnchorPosition } from "@pine/ui";

type ItemRowActionsMenuProps = {
  anchorPosition: MenuAnchorPosition | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onRename?: () => void;
};

export const ItemRowActionsMenu = ({
  anchorPosition,
  open,
  onClose,
  onDelete,
  onRename,
}: ItemRowActionsMenuProps) => (
  <Menu anchorPosition={anchorPosition} open={open} onClose={onClose}>
    <MenuItem onClick={onRename} isDisabled={!onRename}>
      <MenuItemIcon>
        <EditOutlined fontSize="small" />
      </MenuItemIcon>
      Rename
    </MenuItem>
    <MenuItem isDisabled>
      <MenuItemIcon>
        <ArchiveOutlined fontSize="small" />
      </MenuItemIcon>
      Archive
    </MenuItem>
    <MenuItem onClick={onDelete}>
      <MenuItemIcon>
        <DeleteOutlineOutlined fontSize="small" />
      </MenuItemIcon>
      Delete
    </MenuItem>
  </Menu>
);
