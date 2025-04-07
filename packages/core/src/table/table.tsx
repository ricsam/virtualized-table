import { Row, RowData, Table } from "@tanstack/react-table";
import React from "react";
import { defaultSkin } from "../default_skin/default_skin";
import { ColDndHandler, RowDndHandler } from "../dnd_handler";
import { MeasureCellProvider } from "../measure_cell_provider";
import { Skin } from "../skin";
import { useColContext } from "./cols/col_context";
import { ColProvider } from "./cols/col_provider";
import { HeaderGroup } from "./cols/header_group";
import { useVirtualRowContext } from "./rows/virtual_row_context";
import { VirtualRowProvider } from "./rows/virtual_row_provider";
import { TableBody } from "./table_body";
import { TableContext, useTableContext } from "./table_context";
import { CellRefs, MeasureData } from "./types";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    autoCrush?: boolean;
    fillAvailableSpaceAfterCrush?: boolean;
  }
}

export const ReactTanstackTableUi = function ReactTanstackTableUi<T>(props: {
  table: Table<T>;
  rowDndHandler?: RowDndHandler<T>;
  colDndHandler?: ColDndHandler<T>;
  skin?: Skin;
  width: number;
  height: number;
  rowOverscan?: number;
  columnOverscan?: number;
  renderSubComponent?: (args: { row: Row<T> }) => React.ReactNode;
  underlay?: React.ReactNode;
  autoCrushColumns?: boolean;
  disableScroll?: boolean;
  pinColsRelativeTo?: "cols" | "table";
  pinRowsRelativeTo?: "rows" | "table";
  crushMinSizeBy?: "header" | "cell" | "both";
  fillAvailableSpaceAfterCrush?: boolean;
  scrollbarWidth?: number;
}) {
  const { table } = props;
  const tableContainerRef = React.useRef<HTMLDivElement | null>(null);

  if (table.getIsSomeColumnsPinned() && !table.options.enableColumnPinning) {
    throw new Error(
      "column pinning will not work unless enableColumnPinning is set to true",
    );
  }

  const [onMeasureCb, setOnMeasureCb] = React.useState<
    undefined | ((measureData: MeasureData) => void)
  >(undefined);

  const measureCells = React.useCallback(
    (cb: (measureData: MeasureData) => void) =>
      setOnMeasureCb(() => {
        return (measureData: MeasureData) => {
          cb(measureData);
          setOnMeasureCb(undefined);
        };
      }),
    [],
  );

  const refsValue = {
    table,
    props
  };
  const refs = React.useRef(refsValue);
  refs.current = refsValue;

  React.useEffect(() => {
    if (!props.autoCrushColumns) {
      return;
    }

    const onMeasureCb = ({ cols }: MeasureData) => {
      refs.current.table.setColumnSizing((prev) => {
        const newSizing = { ...prev };
        let totalSize = 0;

        const colsToCrush = new Map<string, CellRefs[string][]>();
        const colsThatCanFill = new Set<string>();
        cols.forEach((col, colId) => {
          if (!col) {
            return;
          }
          const tsCol = refs.current.table.getColumn(colId);
          if (tsCol?.columnDef.meta?.autoCrush !== false) {
            colsToCrush.set(colId, col);
          } else {
            totalSize += tsCol.getSize();
          }
          if (tsCol?.columnDef.meta?.fillAvailableSpaceAfterCrush !== false) {
            colsThatCanFill.add(colId);
          }
        });

        colsToCrush.forEach((col, colId) => {
          const colWidth = Math.max(...col.map(({ rect }) => rect.width));
          totalSize += colWidth;
          newSizing[colId] = colWidth;
        });
        const totalWidth = refs.current.props.width - (refs.current.props.scrollbarWidth ?? 0);
        if (refs.current.props.fillAvailableSpaceAfterCrush && totalSize < totalWidth) {
          const delta = totalWidth - totalSize;
          const perColumnDelta = delta / colsThatCanFill.size;
          colsThatCanFill.forEach((colId) => {
            newSizing[colId] += perColumnDelta;
          });
        }
        return newSizing;
      });
    };
    if (props.autoCrushColumns) {
      measureCells(onMeasureCb);
    }
  }, [measureCells, props.autoCrushColumns]);

  return (
    <TableContext.Provider
      value={React.useMemo(
        () => ({
          width: props.width,
          height: props.height,
          tableContainerRef: tableContainerRef,
          table,
          skin: props.skin ?? defaultSkin,
          config: {
            rowOverscan: props.rowOverscan ?? 10,
            columnOverscan: props.columnOverscan ?? 3,
          },
          renderSubComponent: props.renderSubComponent,
          onMeasureCallback: onMeasureCb,
          measureCells,
          disableScroll: props.disableScroll,
          pinColsRelativeTo: props.pinColsRelativeTo ?? "cols",
          pinRowsRelativeTo: props.pinRowsRelativeTo ?? "rows",
          crushMinSizeBy: props.crushMinSizeBy ?? "cell",
        }),
        [
          props.width,
          props.height,
          props.skin,
          props.rowOverscan,
          props.columnOverscan,
          props.renderSubComponent,
          table,
          onMeasureCb,
          measureCells,
          props.disableScroll,
          props.pinColsRelativeTo,
          props.pinRowsRelativeTo,
          props.crushMinSizeBy,
        ],
      )}
    >
      <ColProvider>
        <VirtualRowProvider>
          <Body underlay={props.underlay} />
        </VirtualRowProvider>
      </ColProvider>
    </TableContext.Provider>
  );
};

function Body({ underlay }: { underlay?: React.ReactNode }) {
  const { skin, onMeasureCallback, pinColsRelativeTo } = useTableContext();
  const { rows, offsetBottom, offsetTop } = useVirtualRowContext();
  const { footerGroups, headerGroups } = useColContext();

  const body = (
    <TableBody
      rows={rows}
      offsetBottom={offsetBottom}
      offsetTop={offsetTop}
    ></TableBody>
  );

  return (
    <skin.OverlayContainer>
      <skin.OuterContainer>
        {underlay}

        <skin.TableScroller />

        {headerGroups.length > 0 && (
          <skin.TableHeader>
            {headerGroups.map((headerGroup) => {
              return (
                <HeaderGroup
                  key={headerGroup.id}
                  {...headerGroup}
                  type="header"
                />
              );
            })}
          </skin.TableHeader>
        )}

        {body}

        {onMeasureCallback && (
          <div
            className="rtui-measure-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              visibility: "hidden",
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <MeasureCellProvider onMeasureCallback={onMeasureCallback}>
              {body}
            </MeasureCellProvider>
          </div>
        )}
        {footerGroups.length > 0 && (
          <skin.TableFooter>
            {footerGroups.map((footerGroup) => {
              return (
                <HeaderGroup
                  key={footerGroup.id}
                  {...footerGroup}
                  type="footer"
                />
              );
            })}
          </skin.TableFooter>
        )}
        {skin.PinnedColsOverlay && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width:
                pinColsRelativeTo === "table"
                  ? "max(var(--table-width), 100%)"
                  : "var(--table-width)",
              height:
                "max(var(--table-height) + var(--header-height) + var(--footer-height), 100%)",
              backgroundColor: "transparent",
              zIndex: 1000,
              display: "flex",
              pointerEvents: "none",
            }}
          >
            <skin.PinnedColsOverlay position="left" />
            <div style={{ flex: 1 }}></div>
            <skin.PinnedColsOverlay position="right" />
          </div>
        )}
      </skin.OuterContainer>
    </skin.OverlayContainer>
  );
}
