import { createNotFoundRoute } from "@vercel/geistdocs/routes/not-found";
import { config } from "@/lib/geistdocs/config";

export const { GET } = createNotFoundRoute({ config });
