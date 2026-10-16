import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sessoes-cortesia")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
