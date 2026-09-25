import {
  columnGroupingFeature,
  createExpandedRowModel,
  createGroupedRowModel,
  createTableHook,
  rowExpandingFeature,
  tableFeatures,
  type RowData,
} from "@tanstack/react-table";

export const pineTableFeatures = tableFeatures({
  columnGroupingFeature,
  rowExpandingFeature,
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
});

export type PineTableFeatures = typeof pineTableFeatures;

export const {
  createAppColumnHelper: createPineColumnHelper,
  useAppTable: usePineTable,
  useTableContext: usePineTableContext,
} = createTableHook({
  features: pineTableFeatures,
});

export type PineTableInstance<TData extends RowData = RowData> = ReturnType<
  typeof usePineTableContext<TData>
>;
