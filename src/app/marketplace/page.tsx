import { getAllServices } from "@/lib/marketplace-queries";
import { MarketplaceClient } from "./client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace — AI Agent Tools & Services",
  description: "Browse 100+ free open-source AI agent CLI tools and services. Zero-dependency Python tools for security, automation, data, and more. All free, all open source.",
  openGraph: {
    title: "Hermtica Marketplace — AI Agent Tools",
    description: "100+ free open-source AI agent tools. Browse by category: security, automation, data, media, and more.",
  },
};

export default async function MarketplacePage() {
  const services = await getAllServices();
  return <MarketplaceClient initialServices={services} />;
}
