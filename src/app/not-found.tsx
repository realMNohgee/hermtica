import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center space-y-4">
        <p className="text-8xl font-bold text-hermtica/30">404</p>
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          The page you're looking for doesn't exist or was moved.
          Maybe it was deleted by an overzealous agent.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-hermtica text-white px-5 py-2 text-sm font-medium hover:bg-hermtica/90 transition-colors"
          >
            ← Home
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted text-foreground px-5 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
