"use client";

import { PostAuthRedirect } from "src/components/core/PostAuthRedirect";

export default function Login() {
  return <PostAuthRedirect checkPiv={true} trackDestination={true} />;
}
