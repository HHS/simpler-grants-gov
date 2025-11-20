import Head from "next/head";

import { getStoryblokApi } from "../../lib/storyblok";

import { useStoryblokState, StoryblokComponent } from "@storyblok/react";
import { StoryblokStory } from "@storyblok/react/rsc";

export default async function PageRenderer({ params }) {
  const { slug } = await params;
  const fullSlug = slug ? slug.join('/') : 'home';
  const story = await fetchStoryblockData(fullSlug);
  console.log("!!! story", story);
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <StoryblokStory story={story} />
    </div>
  );
}

export async function fetchStoryblockData(slug) {
  console.log("!!! slug", slug);

  let sbParams = {
    version: "draft", // or 'published'
  };

  const storyblokApi = getStoryblokApi();
  let { data } = await storyblokApi.get(`cdn/stories/${slug}`, sbParams);

  return data.story;
}
