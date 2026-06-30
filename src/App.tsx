// Root of the app. Delegates everything to AppLayout, which owns the router
// and the shared shell (sidebar + content). Keeping this file thin lets us
// swap out the layout (or add providers) without touching App.tsx.

import type { ReactElement } from "react";
import { AppLayout } from "./app/layout";

export default function App(): ReactElement {
  return <AppLayout />;
}