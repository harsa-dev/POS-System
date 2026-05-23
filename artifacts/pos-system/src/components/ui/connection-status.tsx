import type { ConnectionStatus } from "@/lib/use-realtime";

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

const labels: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  connected: "Live",
  disconnected: "Reconnecting…",
};

const dotColors: Record<ConnectionStatus, string> = {
  connecting: "bg-yellow-400 animate-pulse",
  connected: "bg-emerald-400",
  disconnected: "bg-red-400 animate-pulse",
};

const textColors: Record<ConnectionStatus, string> = {
  connecting: "text-yellow-600",
  connected: "text-emerald-600",
  disconnected: "text-red-600",
};

export function ConnectionStatusBadge({
  status,
  className = "",
}: ConnectionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-neutral-200 ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[status]}`} />
      <span className={textColors[status]}>{labels[status]}</span>
    </span>
  );
}
