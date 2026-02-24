import { StatsBar } from "./components/StatsBar";
import { EventFeed } from "./components/EventFeed";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
        <h1 className="text-lg font-bold text-gray-800">
          GuardProxy Dashboard
        </h1>
        <span className="ml-auto text-xs text-gray-400">Live</span>
      </header>
      <StatsBar />
      <EventFeed />
    </div>
  );
}
