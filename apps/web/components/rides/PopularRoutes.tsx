import { ArrowRight, MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";

const routes = [
  {
    from: "Parul University",
    to: "Vadodara Railway Station",
  },
  {
    from: "Parul University",
    to: "Vadodara Airport",
  },
  {
    from: "Parul University",
    to: "Ahmedabad",
  },
  {
    from: "Parul University",
    to: "Anand",
  },
];

export function PopularRoutes() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Popular Routes</h2>

        <p className="text-sm text-muted-foreground">
          Frequently searched destinations by students.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {routes.map((route) => (
          <Card
            key={`${route.from}-${route.to}`}
            className="cursor-pointer p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span className="font-medium">{route.from}</span>
            </div>

            <div className="ml-2 my-3">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              <span className="font-medium">{route.to}</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
