import {
  columnGroupingFeature,
  createExpandedRowModel,
  createGroupedRowModel,
  createTableHook,
  rowExpandingFeature,
  tableFeatures,
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
