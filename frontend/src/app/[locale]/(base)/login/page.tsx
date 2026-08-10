"use client";

import { PostAuthRedirect } from "src/components/core/PostAuthRedirect";

export default function LoginPage() {
  return (
    <PostAuthRedirect
      errorMessage="Unable to redirect properly on login"
      checkPiv={true}
    />
  );
  // const router = useRouter();
  // const searchParams = useSearchParams();

  // useEffect(() => {
  //   try {
  //     const redirectURL = SessionStorage.getItem("login-redirect");
  //     SessionStorage.removeItem("login-redirect");
  //     if (searchParams.get("pivError")) {
  //       SessionStorage.setItem("showPivError", "true");
  //     }

  //     if (redirectURL?.substring(0, 1) !== "/") {
  //       router.push("/");
  //     }
  //     router.push(redirectURL || "/");
  //     return () => {
  //       return SessionStorage.removeItem("login-redirect");
  //     };
  //   } catch (e) {
  //     console.error("Unable to redirect properly on logout", e);
  //     router.push("/");
  //   }
  // }, [router, searchParams]);

  // return (
  //   <GridContainer className="margin-y-5">
  //     <Grid className="flex-align-center display-flex">
  //       <USWDSIcon name="autorenew" className="usa-icon--size-3" />
  //       <div className="padding-left-05 padding-top-05 font-sans-md">
  //         Redirecting...
  //       </div>
  //     </Grid>
  //   </GridContainer>
  // );
}
