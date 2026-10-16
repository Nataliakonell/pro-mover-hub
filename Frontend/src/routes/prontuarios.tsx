import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/prontuarios")({
  beforeLoad: () => {
    throw redirect({ to: "/participantes" });
  },
  component: () => null,
});
