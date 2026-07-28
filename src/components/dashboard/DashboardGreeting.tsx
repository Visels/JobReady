"use client";

import { useEffect, useState } from "react";

function localGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({
  name,
  initialGreeting,
}: {
  name: string;
  initialGreeting: string;
}) {
  const [greeting, setGreeting] = useState(initialGreeting);

  useEffect(() => {
    const updateGreeting = () => setGreeting(localGreeting());
    const timeoutId = window.setTimeout(updateGreeting, 0);
    const intervalId = window.setInterval(updateGreeting, 60_000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  return <>{greeting}, {name}</>;
}
