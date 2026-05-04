import * as React from "react";
import { color, font } from "./tokens";

export interface InfoRow {
  label: string;
  value: React.ReactNode;
}

export interface InfoTableProps {
  rows: InfoRow[];
}

export function InfoTable({ rows }: InfoTableProps) {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      width="100%"
      style={{
        borderCollapse: "collapse",
        fontFamily: font.sans,
        fontSize: 14,
        margin: "8px 0 4px",
        border: `1px solid ${color.line}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={i}
            style={{
              backgroundColor: i % 2 === 0 ? color.paper : color.white,
            }}
          >
            <td
              style={{
                padding: "10px 14px",
                color: color.muted,
                width: "38%",
                borderBottom:
                  i === rows.length - 1 ? "none" : `1px solid ${color.line}`,
                verticalAlign: "top",
              }}
            >
              {r.label}
            </td>
            <td
              style={{
                padding: "10px 14px",
                color: color.ink,
                borderBottom:
                  i === rows.length - 1 ? "none" : `1px solid ${color.line}`,
                verticalAlign: "top",
              }}
            >
              {r.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default InfoTable;
