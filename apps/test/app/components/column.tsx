import type { ReactNode } from "react";

type ColumnProps = {
  title: string;
  children: ReactNode;
};

export const Column = ({ title, children }: ColumnProps) => (
  <div className="flex h-full flex-col divide-y overflow-hidden">
    <div className="shrink-0 bg-secondary p-4">
      <p className="font-medium text-sm">{title}</p>
    </div>
    <div className="flex-1 overflow-y-auto p-4">{children}</div>
  </div>
);
