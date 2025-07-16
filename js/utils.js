// utils.js - Shared utility functions for webOS

// Example utility: clamp a number between min and max
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Simple test (run in browser console or Node)
if (typeof window === "undefined") {
  // Node.js test
  console.assert(clamp(5, 1, 10) === 5, "Clamp in range");
  console.assert(clamp(-1, 0, 10) === 0, "Clamp below min");
  console.assert(clamp(20, 0, 10) === 10, "Clamp above max");
  console.log("utils.js tests passed");
}
