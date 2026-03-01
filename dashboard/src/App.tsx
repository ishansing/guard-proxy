import { StatsBar } from "./components/StatsBar";
import { EventFeed } from "./components/EventFeed";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3 bg-gray-900">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <h1 className="text-lg font-bold tracking-tight">GuardProxy</h1>
        <span className="text-xs text-emerald-400 font-mono">● LIVE</span>
        <span className="ml-auto text-xs text-gray-500 font-mono">
          {new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}
        </span>
      </header>

      <main className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
        <StatsBar />
        <EventFeed />
      </main>
    </div>
  );
}
