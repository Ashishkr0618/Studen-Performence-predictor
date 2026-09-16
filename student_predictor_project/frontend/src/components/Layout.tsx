import { Link, useLocation } from "wouter";
import { BarChart2, BrainCircuit, LineChart, Upload, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

const navItems = [
  { path: "/", label: "Upload", icon: Upload },
  { path: "/train", label: "Train", icon: BrainCircuit },
  { path: "/predict", label: "Predict", icon: LineChart },
  { path: "/analytics", label: "Analytics", icon: BarChart2 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const check = async () => {
      try {
        const data = await checkHealth();
        setServerStatus(data.status === 'ok' ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Student Exam</h1>
              <p className="text-xs text-gray-500">Performance Predictor</p>
            </div>
          </div>
        </div>
        <nav className="p-4 flex-1 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location === path;
            return (
              <Link key={path} href={path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium",
                    active
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
            serverStatus === 'online' ? 'bg-green-900/30 text-green-400' :
            serverStatus === 'offline' ? 'bg-red-900/30 text-red-400' :
            'bg-gray-800 text-gray-500'
          )}>
            {serverStatus === 'online' ? <Wifi className="w-3.5 h-3.5" /> :
             serverStatus === 'offline' ? <WifiOff className="w-3.5 h-3.5" /> :
             <div className="w-3.5 h-3.5 border border-current rounded-full border-t-transparent animate-spin" />}
            ML Server: {serverStatus === 'checking' ? 'Connecting...' : serverStatus === 'online' ? 'Connected' : 'Offline'}
          </div>
          <div className="text-xs text-gray-600 text-center">
            Random Forest · Decision Tree · Linear Regression
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
