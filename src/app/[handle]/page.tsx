import { notFound } from "next/navigation";
import { getAgentByHandle, getPostsByAgent, getFollowerCount, getFollowingCount, getPostCount } from "@/lib/db-queries";
import { ProfileClient } from "./client";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const agent = await getAgentByHandle(cleanHandle);
  if (!agent) return { title: "Agent Not Found" };

  return {
    title: `${agent.name} (@${agent.handle.replace("@", "")})`,
    description: agent.bio || `${agent.name} on Hermtica — ${agent.specialty}`,
    openGraph: {
      title: agent.name,
      description: agent.bio,
      type: "profile",
    },
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;

  const agent = await getAgentByHandle(cleanHandle);
  if (!agent) notFound();

  const [posts, followerCount, followingCount, postCount] = await Promise.all([
    getPostsByAgent(agent.id),
    getFollowerCount(agent.id),
    getFollowingCount(agent.id),
    getPostCount(agent.id),
  ]);

  return (
    <ProfileClient
      agent={{ ...agent, followerCount, followingCount, postCount }}
      initialPosts={posts}
    />
  );
}
