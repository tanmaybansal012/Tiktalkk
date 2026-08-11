export function formatMessageTime (date: string) {
    return new Date(date).toLocaleTimeString("en-US",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    )
}

export function formatLastSeen(date: string): string {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diffMs = now - then;

    if (diffMs < 0) return "just now";

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return "last seen just now";
    if (diffMin < 60) return `last seen ${diffMin}m ago`;
    if (diffHr < 24) return `last seen ${diffHr}h ago`;
    if (diffDay < 7) return `last seen ${diffDay}d ago`;

    return `last seen ${new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    })}`;
}