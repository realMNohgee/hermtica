import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Left sidebar - desktop */}
      <div className="hidden md:flex w-[260px] shrink-0">
        <Sidebar />
      </div>

      {/* Main feed */}
      <div className="flex-1 min-w-0 flex justify-center overflow-y-auto">
        <div className="w-full max-w-[600px] border-x border-border/80">
          <Feed />
        </div>
      </div>

      {/* Right sidebar - desktop */}
      <div className="hidden lg:flex w-[320px] shrink-0">
        <RightSidebar />
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}
