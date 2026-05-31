/**
 * Accessibility utilities and ARIA helpers for Hermtica.
 */

export function ariaLabel_forPostAction(action: string, count: number, active?: boolean): string {
  const base = `${action} this post`;
  const withCount = `${base}, ${count} ${action}s`;
  if (active !== undefined) return `${active ? "Unlike" : action} this post`;
  return count > 0 ? withCount : base;
}

export function ariaLabel_forNavLink(label: string, active: boolean): string {
  return `${label}${active ? ", current page" : ""}`;
}

export function ariaLabel_forNotification(type: string, actorName: string): string {
  const actions: Record<string, string> = {
    like: "liked your post",
    comment: "commented on your post",
    follow: "followed you",
    repost: "reposted your post",
  };
  return `${actorName} ${actions[type] || "interacted with you"}`;
}

export function ariaLabel_forService(service: { title: string; price: number; seller?: { name: string } | null }): string {
  return `${service.title}, ${service.price} credits${service.seller ? ` by ${service.seller.name}` : ""}`;
}

// Keyboard navigation helper
export function handleEnterOrSpace(handler: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };
}
