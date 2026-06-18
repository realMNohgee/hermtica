import { TerminalNav } from "@/components/TerminalNav";
import { Feed } from "@/components/Feed";
import { LeftPanel } from "@/components/LeftPanel";
import { TerminalPanel } from "@/components/TerminalPanel";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TerminalNav />

      <div className="flex-1 flex min-h-0">
        {/* Left panel — trending tools & AI news */}
        <LeftPanel />

        {/* Main feed */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-[680px] px-4 md:px-6 pt-4 pb-20 md:pb-6">
            <Feed />
          </div>
        </div>

        {/* Right panel — system status */}
        <TerminalPanel />
      </div>

      <MobileBottomNav />
    </div>
  );
}
