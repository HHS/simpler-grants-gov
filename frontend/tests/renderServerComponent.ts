import { render } from "@testing-library/react";

import React, {
  Children,
  cloneElement,
  isValidElement,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";

function setFakeReactDispatcher<T>(action: () => T): T {
  /**
   * We use some internals from React to avoid a lot of warnings in our tests when faking
   * to render server components. If the structure of React changes, this function should still work,
   * but the tests will again print warnings.
   *
   * If this is the case, this function can also simply be removed and all tests should still function.
   */

  if (
    !(
      "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE" in React
    )
  ) {
    return action();
  }

  const secret =
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  if (!secret || typeof secret !== "object" || !("H" in secret)) {
    return action();
  }

  const previousDispatcher = secret.H;
  try {
    secret.H = new Proxy(
      {},
      {
        get() {
          throw new Error("This is a client component");
        },
      },
    );
  } catch {
    return action();
  }

  const result = action();

  secret.H = previousDispatcher;

  return result;
}

async function evaluateServerComponent(
  node: ReactElement,
): Promise<ReactElement> {
  if (node && node.type?.constructor?.name === "AsyncFunction") {
    // Handle async server nodes by calling await.

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const evaluatedNode = (await node.type({ ...node.props })) as ReactElement;
    return evaluateServerComponent(evaluatedNode);
  }

  if (node && node.type?.constructor?.name === "Function") {
    try {
      return setFakeReactDispatcher(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const evaluatedNode = node.type({ ...node.props }) as ReactElement;
        return evaluateServerComponent(evaluatedNode);
      });
    } catch {
      // If evaluating fails with a function node, it might be because of using client side hooks.
      // In that case, simply return the node, it will be handled by the react testing library render function.
      return node;
    }
  }

  return node;
}

async function evaluateServerComponentAndChildren(node: ReactElement) {
  const evaluatedNode = (await evaluateServerComponent(
    node,
  )) as ReactElement<PropsWithChildren>;

  if (!evaluatedNode?.props.children) {
    return evaluatedNode;
  }

  const children = Children.toArray(evaluatedNode.props.children);
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    if (!isValidElement(child)) {
      continue;
    }

    children[i] = await evaluateServerComponentAndChildren(child);
  }

  return cloneElement(evaluatedNode, {}, ...children);
}

// Follow <https://github.com/testing-library/react-testing-library/issues/1209>
// for the latest updates on React Testing Library support for React Server
// Components (RSC)
export async function renderServerComponent(
  nodeOrPromise: ReactNode | Promise<ReactNode>,
) {
  const node = await nodeOrPromise;

  if (isValidElement(node)) {
    const evaluatedNode = await evaluateServerComponentAndChildren(node);
    return render(evaluatedNode);
  }

  return render(node);
}
