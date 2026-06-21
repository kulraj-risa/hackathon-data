import { useEffect, useState } from "react";
import { TableCellType, TableHeader } from "../components/custom-table/table";
import { CmmOrderTableHeader } from "../pages/cmmOrder/table/cmmOrderTableData";

interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  visible: boolean;
  sortable: boolean;
}

const STORAGE_KEY = "worklist_columns_config_v5";

const baseKeySet = new Set(CmmOrderTableHeader.map((h) => h.key));

export function useWorklistColumnConfig(): {
  headers: TableHeader[];
  loading: boolean;
} {
  const [headers, setHeaders] = useState<TableHeader[]>(CmmOrderTableHeader);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as { columns: ColumnConfig[] };
        if (data?.columns && data.columns.length > 0) {
          const configMap = new Map<
            string,
            { cfg: ColumnConfig; idx: number }
          >();
          data.columns.forEach((cfg, idx) =>
            configMap.set(cfg.key, { cfg, idx }),
          );

          const merged: TableHeader[] = [];

          // Merge config overrides onto existing base headers
          for (const base of CmmOrderTableHeader) {
            const entry = configMap.get(base.key);
            if (!entry) {
              merged.push(base);
              continue;
            }
            const { cfg, idx } = entry;
            if (!cfg.visible) continue;
            merged.push({
              ...base,
              width: cfg.width,
              sortable: cfg.sortable,
              order: idx,
            });
          }

          // Append custom columns that don't exist in the base header set
          for (const [key, { cfg, idx }] of configMap.entries()) {
            if (baseKeySet.has(key)) continue;
            if (!cfg.visible) continue;
            merged.push({
              key,
              label: cfg.label,
              width: cfg.width,
              sortable: cfg.sortable ?? false,
              order: idx,
              type: TableCellType.STRING,
            });
          }

          merged.sort((a, b) => a.order - b.order);
          setHeaders(merged);
        }
      }
    } catch {
      // fall back to defaults
    } finally {
      setLoading(false);
    }
  }, []);

  return { headers, loading };
}
