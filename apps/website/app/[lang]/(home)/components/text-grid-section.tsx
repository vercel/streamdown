import type { ReactNode } from "react";

interface TextGridSectionProps {
  data: {
    id: string;
    title: string;
    description: ReactNode;
  }[];
}

export const TextGridSection = ({ data }: TextGridSectionProps) => (
  <div className="grid gap-8 px-4 py-8 sm:grid-cols-2 sm:px-12 sm:py-12 md:grid-cols-3">
    {data.map((item) => (
      <div key={item.id}>
        <h3 className="mb-2 font-semibold text-lg tracking-tight">
          {item.title}
        </h3>
        <p className="text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline">
          {item.description}
        </p>
      </div>
    ))}
  </div>
);
