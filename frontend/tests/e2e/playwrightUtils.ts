import {
  BrowserContextOptions,
  expect,
  FullProject,
  Page,
} from "@playwright/test";

export interface PageProps {
  page: Page;
  browserName?: string;
  contextOptions?: BrowserContextOptions;
}

export async function waitForURLChange(
  page: Page,
  changeCheck: (url: string) => boolean,
  timeout = 30000, // query params get set after a debounce period)
) {
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    const changeComplete = changeCheck(page.url());
    if (changeComplete) {
      return;
    }

    await page.waitForTimeout(500);
  }

  throw new Error(`URL did not update as expected within ${timeout}ms`);
}

export async function waitForURLContainsQueryParamValue(
  page: Page,
  queryParamName: string,
  queryParamValue: string,
  timeout = 30000, // query params get set after a debounce period
) {
  // const changeCheck = (pageUrl: string): boolean => {
  //   const url = new URL(pageUrl);
  //   const params = new URLSearchParams(url.search);
  //   const actualValue = params.get(queryParamName);

  //   return actualValue === queryParamValue;
  // };
  // try {
  //   await waitForURLChange(page, changeCheck, timeout);
  // } catch (_e) {
  //   throw new Error(
  //     `Url did not change to contain ${queryParamName}:${queryParamValue} as expected`,
  //   );
  // }

  // return expect(page.url()).toContain(
  //   `${queryParamName}=${queryParamValue}`,
  // );

  const expectedQueryString = `${queryParamName}=${queryParamValue}`;

  return await page.waitForURL(new RegExp(expectedQueryString));
}

export async function waitForUrl(
  page: Page,
  url: string,
  timeout = 30000, // query params get set after a debounce period
) {
  const changeCheck = (pageUrl: string): boolean => {
    return pageUrl === url;
  };
  await waitForURLChange(page, changeCheck, timeout);
}

export async function waitForURLContainsQueryParam(
  page: Page,
  queryParamName: string,
  timeout = 30000, // query params get set after a debounce period
) {
  const changeCheck = (pageUrl: string): boolean => {
    const url = new URL(pageUrl);
    const params = new URLSearchParams(url.search);
    const actualValue = params.get(queryParamName);

    return !!actualValue;
  };
  await waitForURLChange(page, changeCheck, timeout);
}

export async function waitForAnyURLChange(
  page: Page,
  initialUrl: string,
  timeout = 30000, // query params get set after a debounce period
) {
  const changeCheck = (pageUrl: string): boolean => {
    return pageUrl !== initialUrl;
  };
  await waitForURLChange(page, changeCheck, timeout);
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// adapted from https://stackoverflow.com/a/1349426
export const generateRandomString = (desiredPattern: number[]) => {
  const numberOfPossibleCharacters = characters.length;
  return desiredPattern.reduce((randomString, numberOfCharacters, index) => {
    let counter = 0;
    while (counter < numberOfCharacters) {
      randomString += characters.charAt(
        Math.floor(Math.random() * numberOfPossibleCharacters),
      );
      counter += 1;
    }
    if (index < desiredPattern.length - 1) {
      randomString += " ";
    }
    return randomString;
  }, "");
};

// signs in using mock 0auth server
// note that this does not currently work in CI, but does work locally
// an unknown error prevents sending the token back successfully from the API in CI
// this will be remedied by https://github.com/HHS/simpler-grants-gov/issues/3791
// after which we can reenable sign in related tests
export const performSignIn = async (page: Page, project: FullProject) => {
  const signInButton = page.locator('button[data-testid="sign-in-button"]');
  await expect(signInButton).toHaveText("Sign in");
  await signInButton.click();
  const secondSignInButton = page.locator(".usa-modal__footer a");
  await secondSignInButton.click();

  await waitForAnyURLChange(page, "/");

  const requiredInput = page.locator('input[type="text"]');
  const submitButton = page.locator('input[type="submit"]');
  const randomUserName = generateRandomString([12]);

  await requiredInput.fill(randomUserName);
  await submitButton.click();

  await waitForUrl(page, "http://localhost:3000/");

  if (project.name.match(/[Mm]obile/)) {
    const userDropdown = page.locator(
      'button[data-testid="navDropDownButton"]',
    );
    await userDropdown.click();
    await expect(
      page.locator("#user-control > li:first-child a div"),
    ).toHaveText("fake_mail@mail.com");
  } else {
    await expect(
      page.locator('button[data-testid="navDropDownButton"] a div'),
    ).toHaveText("fake_mail@mail.com");
  }
};

export const openMobileNav = async (page: Page) => {
  const menuOpener = page.locator(`button[data-testid="navMenuButton"]`);
  await menuOpener.click();
  return menuOpener;
};

export async function refreshPageWithCurrentURL(page: Page) {
  const currentURL = page.url();
  await page.goto(currentURL); // go to new url in same tab
  return page;
}
