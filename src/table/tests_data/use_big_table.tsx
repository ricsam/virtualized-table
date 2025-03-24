import {
  ColumnDef,
  ColumnOrderState,
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { generateTableData, User } from "./generate_table_data";
import { IndeterminateCheckbox } from "../indeterminate_checkbox";
import { RowDragHandleCell } from "../rows/row_drag_handle_cell";
import { iterateOverColumns } from "./iterate_over_columns";
import { ExpandRowButton } from "../rows/expand_row_button";

export const useBigTable = () => {
  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<User>();

    const includeLeafRows = true;
    const includeParentRows = true;

    const columns: ColumnDef<User, any>[] = [
      columnHelper.group({
        id: "misc",
        footer: () => "Misc",
        columns: [
          {
            id: "pin-row",
            header: () => "Pin",
            cell: ({ row }) =>
              row.getIsPinned() ? (
                <button
                  onClick={() =>
                    row.pin(false, includeLeafRows, includeParentRows)
                  }
                >
                  ❌
                </button>
              ) : (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() =>
                      row.pin("top", includeLeafRows, includeParentRows)
                    }
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() =>
                      row.pin("bottom", includeLeafRows, includeParentRows)
                    }
                  >
                    ⬇️
                  </button>
                </div>
              ),
          },
          {
            id: "expander",
            header: () => null,
            cell: ({ row }) => {
              return row.getCanExpand() ? (
                <button
                  {...{
                    onClick: row.getToggleExpandedHandler(),
                    style: { cursor: "pointer" },
                  }}
                >
                  {row.getIsExpanded() ? "⬇️" : "➡️"}
                </button>
              ) : (
                "🔵"
              );
            },
          },
          {
            id: "select",
            header: ({ table }) => (
              <IndeterminateCheckbox
                {...{
                  checked: table.getIsAllRowsSelected(),
                  indeterminate: table.getIsSomeRowsSelected(),
                  onChange: table.getToggleAllRowsSelectedHandler(),
                }}
              />
            ),
            cell: ({ row }) => (
              <div className="px-1">
                <IndeterminateCheckbox
                  {...{
                    checked: row.getIsSelected(),
                    disabled: !row.getCanSelect(),
                    indeterminate: row.getIsSomeSelected(),
                    onChange: row.getToggleSelectedHandler(),
                  }}
                />
              </div>
            ),
          },
          {
            id: "drag-handle",
            header: "Move",
            cell: ({ row }) => {
              return <RowDragHandleCell rowId={row.id} />;
            },
            size: 60,
          },
        ],
      }),

      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.getValue(),
        id: "id",
      }),
      columnHelper.accessor("fullName", {
        header: "Full Name",
        cell: (info) => info.getValue(),
        id: "full-name",
        size: 200,
      }),
      columnHelper.accessor("location", {
        header: ({ table }) => (
          <>
            <button
              {...{
                onClick: table.getToggleAllRowsExpandedHandler(),
              }}
            >
              {table.getIsAllRowsExpanded() ? "👇" : "👉"}
            </button>{" "}
            Location
          </>
        ),
        cell: ({ row, getValue }) => (
          <div>
            <div>
              <ExpandRowButton row={row} />
              {getValue()}
            </div>
          </div>
        ),
        id: "location",
        size: 200,
      }),
      columnHelper.group({
        id: "country-stuff",
        footer: () => "Country stuff",
        columns: [
          columnHelper.accessor("country", {
            header: "Country",
            cell: (info) => info.getValue(),
            id: "country",
          }),
          columnHelper.accessor("continent", {
            header: "Continent",
            cell: (info) => info.getValue(),
            id: "continent",
            size: 200,
          }),
          columnHelper.accessor("countryCode", {
            header: "Country Code",
            cell: (info) => info.getValue(),
            id: "country-code",
            size: 200,
          }),
          columnHelper.accessor("language", {
            header: "Language",
            cell: (info) => info.getValue(),
            id: "language",
            size: 200,
          }),
        ],
      }),
      columnHelper.accessor("favoriteGame", {
        header: "Favorite Game",
        cell: (info) => info.getValue(),
        id: "favorite-game",
        size: 200,
      }),
      columnHelper.accessor("birthMonth", {
        header: "Birth Month",
        cell: (info) => info.getValue(),
        id: "birth-month",
        size: 200,
      }),
      columnHelper.accessor("isActive", {
        header: "Active",
        cell: (info) => (info.getValue() ? "Yes" : "No"),
        id: "is-active",
        size: 200,
      }),
      columnHelper.group({
        header: "Winnings",
        id: "winnings",
        columns: [
          columnHelper.accessor((data) => data.yearlyWinnings[2021], {
            id: "winnings-2021",
            header: "2021",
            cell: (info) => `$${info.getValue().toLocaleString()}`,
          }),
          columnHelper.accessor((data) => data.yearlyWinnings[2022], {
            id: "winnings-2022",
            header: "2022",
            cell: (info) => `$${info.getValue().toLocaleString()}`,
          }),
          columnHelper.accessor((data) => data.yearlyWinnings[2023], {
            id: "winnings-2023",
            header: "2023",
            cell: (info) => `$${info.getValue().toLocaleString()}`,
          }),
        ],
      }),
      columnHelper.accessor("experienceYears", {
        header: "Experience (Years)",
        cell: (info) => info.getValue(),
        id: "experience-years",
        size: 200,
      }),
      columnHelper.accessor("rating", {
        header: "Rating",
        cell: (info) => info.getValue().toFixed(1),
        id: "rating",
        size: 200,
      }),
      columnHelper.accessor("completedProjects", {
        header: "Completed Projects",
        cell: (info) => info.getValue(),
        id: "completed-projects",
        size: 200,
      }),
      columnHelper.accessor("department", {
        header: "Department",
        cell: (info) => info.getValue(),
        id: "department",
        size: 200,
      }),
    ];
    for (let i = 0; i < 80; i += 1) {
      columns.push(
        columnHelper.accessor("department", {
          header: `Extra ${i}`,
          cell: (info) => info.getValue(),
          id: `extra-${i}`,
          size: 200,
        }),
      );
    }
    return columns;
  }, []);

  const [data, setData] = React.useState<User[]>(() =>
    generateTableData({ maxRows: 1e5 }),
  );

  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(() =>
    iterateOverColumns(columns),
  );
  const getSubRows = (row: User) => {
    return row.otherCountries;
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      columnOrder,
    },
    getRowId(originalRow, index, parent) {
      return String(originalRow.id);
    },
    onColumnOrderChange: setColumnOrder,
    defaultColumn: {
      minSize: 60,
      maxSize: 800,
    },
    columnResizeMode: "onChange",
    getRowCanExpand: () => true,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSubRows,
    enableRowSelection: true,
    keepPinnedRows: true,
  });
  return { data, setData, columnOrder, setColumnOrder, table, getSubRows };
};
