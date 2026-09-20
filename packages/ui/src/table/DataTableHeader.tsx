import { usePineTableContext } from "./pineTableFeatures";

export const DataTableHeader = () => {
  const table = usePineTableContext();

  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              colSpan={header.colSpan}
            >
              {header.isPlaceholder ? null : (
                <table.FlexRender header={header} />
              )}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
};
