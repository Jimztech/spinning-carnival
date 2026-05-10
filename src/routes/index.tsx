import { createFileRoute } from "@tanstack/react-router";
import SpinGame from "../components/SpinGame";

export const Route = createFileRoute("/")({
  component: Index,
});

export function Index() {
  return <SpinGame />;
}