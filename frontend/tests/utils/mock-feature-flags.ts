type Flags = Record<string, boolean>;

let currentFlags: Flags = {};

export function __setFeatureFlags(next: Flags) {
  currentFlags = next;
}

export function useFeatureFlags() {
  return {
    featureFlags: currentFlags,
    checkFeatureFlag: (name: string) => Boolean(currentFlags[name]),
  };
}