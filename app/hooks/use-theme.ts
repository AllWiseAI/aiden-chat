import { useEffect, useState } from "react";
import { Theme } from "../store";

// 响应式获取当前主题色 light / dark
export function useTheme() {
  const [theme, setTheme] = useState<Theme.Light | Theme.Dark>(() => {
    return document.documentElement.classList.contains("dark")
      ? Theme.Dark
      : Theme.Light;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? Theme.Dark : Theme.Light);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
