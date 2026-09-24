import MuiFormControl from "@mui/material/FormControl";
import MuiFormHelperText from "@mui/material/FormHelperText";
import Grid2 from "@mui/material/Grid2";
import MuiSkeleton from "@mui/material/Skeleton";
import MuiTypography from "@mui/material/Typography";
import { Controller, FieldValues, Path, UseControllerProps, UseFormReturn } from "react-hook-form";
import { useFindStatusesQuery } from "@generated/gql";
import { Label, Select } from "@shared";

interface ItemStatusSelectorProps<T extends FieldValues> {
  projectId: string;
  name: Path<T>;
  form: UseFormReturn<T>;
  onSubmit?: (value: string) => void;
  title?: string;
  helperText?: string;
  rules?: UseControllerProps<T>["rules"];
}

/**
 * Reusable item status selector component.
 */
export const ItemStatusSelector = <T extends FieldValues>({
  projectId,
  name,
  form,
  rules,
  onSubmit,
  title,
  helperText,
}: ItemStatusSelectorProps<T>) => {
  const isLoading = false;
  const statusesQuery = useFindStatusesQuery(
    { input: { projectId } },
    {
      select: (data) => data.findStatuses,
      enabled: Boolean(projectId),
    },
  );
  const statuses = statusesQuery.data;

  return (
    <Grid2 container>
      {title && (
        <Grid2 size={12} paddingBottom={1}>
          <Label id={title} title={title} isLoading={isLoading} />
        </Grid2>
      )}
      <MuiFormControl fullWidth>
        {isLoading ? (
          <MuiSkeleton />
        ) : (
          <Controller
            name={name}
            control={form.control}
            rules={rules}
            render={({ field }) => {
              return (
                <Select
                  name={field.name}
                  value={field.value}
                  options={(statuses || []).filter(
                    (status): status is { id: string; name: string } =>
                      Boolean(status.id) && Boolean(status.name),
                  )}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    if (onSubmit) onSubmit(e.target.value as string);
                    field.onChange(e.target.value);
                  }}
                />
              );
            }}
          />
        )}
      </MuiFormControl>
      {isLoading ? (
        <MuiSkeleton width="200px" />
      ) : (
        helperText && (
          <MuiFormHelperText>
            <MuiTypography component="span" sx={{ fontSize: "13px" }}>
              {helperText}
            </MuiTypography>
          </MuiFormHelperText>
        )
      )}
    </Grid2>
  );
};
