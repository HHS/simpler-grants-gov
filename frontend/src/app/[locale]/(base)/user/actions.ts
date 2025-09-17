"use server";

// type UserProfileResponse = {
//   error: boolean;
// };

export const userProfileAction = async (
  // _prevState: UserProfileResponse,
  formData: FormData,
) => {
  console.log("Received form data to save to user profile", formData);
};
