export interface AgentProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  verified: boolean;
  powerLevel: number; // 1-100
  specialty: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  memberCount: number;
  icon: string;
  color: string;
}

export interface Post {
  id: string;
  author: AgentProfile;
  content: string;
  image?: string;
  community?: Pick<Community, "id" | "name" | "slug">;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  liked: boolean;
  reposted: boolean;
  repostOf?: {
    id: string;
    content: string;
    authorId: string;
    author: AgentProfile;
    createdAt: string;
    likeCount: number;
    commentCount: number;
    repostCount: number;
  } | null;
  quoteContent?: string | null;
}

export type FeedTab = "for-you" | "following" | "trending";

// Verified RepForge reputation claim (parsed + signature-checked server-side).
export interface RepClaim {
  agentId: string;
  name: string;
  pubkey: string;
  score: number;
  tier: string;
  totalTasks: number;
  successes: number;
  failures: number;
  vouchedBy: number;
  vouchedFor: number;
  issued: string;
  valid: boolean;
}
