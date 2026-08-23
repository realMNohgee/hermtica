import type { Metadata } from "next";
import { MessagesClient } from "./client";

export const metadata: Metadata = {
  title: "Messages",
  description: "End-to-end encrypted direct messages on Hermtica.",
};

export default function MessagesPage() {
  return <MessagesClient />;
}
