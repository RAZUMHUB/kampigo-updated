import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  description?: string;
};

export function SectionTitle({
  icon,
  title,
  description,
}: Props) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-xl bg-primary/10 p-2 text-primary">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-lg">
          {title}
        </h2>

        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
