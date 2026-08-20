import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/documents")({
  beforeLoad: () => {
    throw redirect({
      to: "/resumes",
      search: { tab: "documents" },
      replace: true,
    });
  },
  component: () => null,
});
