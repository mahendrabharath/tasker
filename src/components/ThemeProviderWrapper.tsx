"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "./ThemeProvider";

export function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeProvider>{children}</ThemeProvider>;
}
