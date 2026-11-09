import { redirect } from "next/navigation";

// Force-dynamic so Vercel never edge-caches the homepage and the redirect always fires.
export const dynamic = "force-dynamic";

export default function Home() {
  redirect("/marketplace");
}
