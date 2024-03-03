export function deepMerge(...sources: any[]): any {
  const merged: any = {};

  sources.forEach((source) => {
    for (const key in source) {
      if (typeof merged[key] === "object" && typeof source[key] === "object") {
        merged[key] = deepMerge(merged[key], source[key]);
      } else {
        merged[key] = source[key];
      }
    }
  });

  return merged;
}
