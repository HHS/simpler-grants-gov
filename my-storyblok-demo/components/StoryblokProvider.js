"use client";

import { getStoryblokApi } from "../lib/storyblok";

export default function StoryblokProvider({ children }) {
  getStoryblokApi();
  return children;
}
