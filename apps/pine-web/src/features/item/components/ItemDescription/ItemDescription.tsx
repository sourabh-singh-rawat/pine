import { useEffect, useState } from "react";

import { ClickAwayListener } from "@mui/base";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import { Grid2, IconButton, Typography, useTheme } from "@mui/material";
import { SubmitHandler, useForm } from "react-hook-form";
import type { UpdateItemInput } from "@generated/gql/graphql";
import { useUpdateItemMutation } from "@generated/gql";
import { TextField, useSnackbar } from "@shared";

interface ItemDescriptionProps {
  itemId: string;
  initialValue?: string | null;
}

/**
 * Update the item description
 */
export const ItemDescription = ({ itemId, initialValue = "" }: ItemDescriptionProps) => {
  const theme = useTheme();
  const snackbar = useSnackbar();
  const form = useForm();
  const [defaultValue, setDefaultValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const updateItemMutation = useUpdateItemMutation();

  const handleClick = () => {
    setIsFocused(true);
  };

  const handleCancel = () => {
    if (updateItemMutation.isPending) return;

    setIsFocused(false);
    form.setValue("description", defaultValue);
  };

  const onSubmit: SubmitHandler<Pick<UpdateItemInput, "description">> = async ({ description }) => {
    if (updateItemMutation.isPending) return;

    await updateItemMutation.mutateAsync({ input: { itemId, description } });
    snackbar.success("Description updated successfully");
    if (description) {
      setDefaultValue(description);
    }
    setIsFocused(false);
  };

  useEffect(() => {
    if (initialValue) {
      form.setValue("description", initialValue);
      setDefaultValue(initialValue);
    }
  }, [initialValue]);

  return (
    <ClickAwayListener onClickAway={handleCancel}>
      <Grid2 rowSpacing={1} container component="form" onSubmit={form.handleSubmit(onSubmit)}>
        <Grid2 size={12}>
          {isFocused ? (
            <TextField
              form={form}
              name="description"
              rows={4}
              sx={{
                ".MuiInputBase-input": {
                  px: 0,
                  py: theme.spacing(0.1),
                },
              }}
              autoFocus
            />
          ) : (
            <Typography
              sx={{
                py: theme.spacing(1),
                px: theme.spacing(1.65),
                borderRadius: theme.shape.borderRadiusSmall,
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.secondary,
                "&:hover": { backgroundColor: theme.palette.action.hover },
              }}
              variant="body1"
              onClick={handleClick}
            >
              {form.watch("description") || "Add a description"}
            </Typography>
          )}
        </Grid2>
        {isFocused && (
          <Grid2 size={{ sm: 12 }}>
            <Grid2 spacing={1} container>
              <Grid2 flexGrow={1}></Grid2>
              <Grid2>
                <IconButton size="small" type="submit" disableRipple>
                  <DoneIcon />
                </IconButton>
              </Grid2>
              <Grid2>
                <IconButton size="small" onClick={handleCancel} disableRipple>
                  <CloseIcon />
                </IconButton>
              </Grid2>
            </Grid2>
          </Grid2>
        )}
      </Grid2>
    </ClickAwayListener>
  );
};
