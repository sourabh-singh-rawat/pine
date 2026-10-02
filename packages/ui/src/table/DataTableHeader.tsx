import { usePineTableContext } from "./pineTableFeatures";

export const DataTableHeader = () => {
  const table = usePineTableContext();
  const totalSize = table.getTotalSize();

  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const size = header.getSize();
            const widthPercent = totalSize > 0 ? (size / totalSize) * 100 : undefined;
            return (
              <th
                key={header.id}
                colSpan={header.colSpan}
                style={widthPercent == null ? undefined : { width: `${widthPercent}%` }}
              >
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
};
