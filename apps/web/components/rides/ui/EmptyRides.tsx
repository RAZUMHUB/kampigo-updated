import { SearchX } from "lucide-react";

type EmptyRidesProps = {
  title?: string;
  description?: string;
};

export function EmptyRides({
  title = "No rides found",
  description = "Try changing your search or check back later.",
}: EmptyRidesProps) {
  return (
    <div className="rounded-3xl border border-dashed p-12 text-center">
      <SearchX className="mx-auto h-12 w-12 text-muted-foreground" />

      <h3 className="mt-6 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
