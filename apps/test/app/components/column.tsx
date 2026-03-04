import type { ReactNode } from "react";

interface ColumnProps {
  children: ReactNode;
  title: string;
}

export const Column = ({ title, children }: ColumnProps) => (
  <div className="flex h-full flex-col divide-y overflow-hidden">
    <div className="shrink-0 bg-secondary p-4">
      <p className="font-medium text-sm">{title}</p>
    </div>
    <div className="flex-1 space-y-4 overflow-y-auto p-4">{children}</div>
  </div>
);
