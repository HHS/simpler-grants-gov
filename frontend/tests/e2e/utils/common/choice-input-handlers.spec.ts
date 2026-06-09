import { expect, test, type Page } from "@playwright/test";

import { checkboxHandler } from "./checkbox-handler";
import { radioButtonHandler } from "./radio-button-handler";
import { type FillFieldDefinition } from "./types";

class FakeLocator {
  checked: boolean;
  id?: string;
  throwOnCheck: boolean;
  throwOnUncheck: boolean;
  clickCount: number;
  countValue: number;
  nested?: FakeLocator;
  onClick?: () => void;

  constructor(options?: {
    checked?: boolean;
    id?: string;
    throwOnCheck?: boolean;
    throwOnUncheck?: boolean;
    countValue?: number;
    nested?: FakeLocator;
    onClick?: () => void;
  }) {
    this.checked = options?.checked ?? false;
    this.id = options?.id;
    this.throwOnCheck = options?.throwOnCheck ?? false;
    this.throwOnUncheck = options?.throwOnUncheck ?? false;
    this.clickCount = 0;
    this.countValue = options?.countValue ?? 1;
    this.nested = options?.nested;
    this.onClick = options?.onClick;
  }

  first() {
    return this;
  }

  waitFor(_options?: unknown) {
    return Promise.resolve();
  }

  click() {
    this.clickCount += 1;
    this.onClick?.();
    return Promise.resolve();
  }

  check(_options?: unknown) {
    if (this.throwOnCheck) {
      throw new Error("check failed");
    }
    this.checked = true;
    return Promise.resolve();
  }

  uncheck(_options?: unknown) {
    if (this.throwOnUncheck) {
      throw new Error("uncheck failed");
    }
    this.checked = false;
    return Promise.resolve();
  }

  isChecked() {
    return Promise.resolve(this.checked);
  }

  getAttribute(name: string) {
    if (name === "id") {
      return Promise.resolve(this.id ?? null);
    }
    return Promise.resolve(null);
  }

  locator(selector: string) {
    if (selector === 'input[type="checkbox"]') {
      return this.nested ?? new FakeLocator({ countValue: 0 });
    }

    return new FakeLocator({ countValue: 0 });
  }

  count() {
    return Promise.resolve(this.countValue);
  }
}

class FakePage {
  private readonly inputLocator: FakeLocator;
  private readonly labelsBySelector: Record<string, FakeLocator>;
  private readonly closed: boolean;

  constructor(options: {
    inputLocator: FakeLocator;
    labelsBySelector?: Record<string, FakeLocator>;
    closed?: boolean;
  }) {
    this.inputLocator = options.inputLocator;
    this.labelsBySelector = options.labelsBySelector ?? {};
    this.closed = options.closed ?? false;
  }

  isClosed() {
    return this.closed;
  }

  locator(selector: string) {
    if (selector in this.labelsBySelector) {
      return this.labelsBySelector[selector];
    }

    return this.inputLocator;
  }
}

const radioField: FillFieldDefinition = {
  field: "Radio field",
  type: "radiobutton",
  selector: "#radio",
};

const checkboxField: FillFieldDefinition = {
  field: "Checkbox field",
  type: "checkbox",
  selector: "#checkbox",
};

test.describe("choice input handlers", () => {
  test("radio handler falls back to label click when check fails", async () => {
    const input = new FakeLocator({ checked: false, id: "radio-1", throwOnCheck: true });
    const label = new FakeLocator({ onClick: () => {
      input.checked = true;
    } });

    const page = new FakePage({
      inputLocator: input,
      labelsBySelector: {
        'label[for="radio-1"]': label,
      },
    }) as unknown as Page;

    await radioButtonHandler(undefined, page, radioField, "Yes");

    await expect(input.isChecked()).resolves.toBe(true);
    expect(label.clickCount).toBe(1);
  });

  test("radio handler throws explicit error when fallback label cannot be resolved", async () => {
    const input = new FakeLocator({ checked: false, throwOnCheck: true });

    const page = new FakePage({
      inputLocator: input,
    }) as unknown as Page;

    await expect(
      radioButtonHandler(undefined, page, radioField, "Yes"),
    ).rejects.toThrow("offscreen and has no id for label fallback");
  });

  test("checkbox handler falls back to label click when check fails", async () => {
    const input = new FakeLocator({ checked: false, id: "checkbox-1", throwOnCheck: true });
    const label = new FakeLocator({ onClick: () => {
      input.checked = true;
    } });

    const page = new FakePage({
      inputLocator: input,
      labelsBySelector: {
        'label[for="checkbox-1"]': label,
      },
    }) as unknown as Page;

    await checkboxHandler(undefined, page, checkboxField, true);

    await expect(input.isChecked()).resolves.toBe(true);
    expect(label.clickCount).toBe(1);
  });

  test("checkbox handler falls back to nested checkbox flow when primary locator is not checkable", async () => {
    const nested = new FakeLocator({ checked: false, id: "nested-checkbox-1", countValue: 1 });
    const input = new FakeLocator({
      checked: false,
      throwOnCheck: true,
      nested,
    });

    const nestedLabel = new FakeLocator({ onClick: () => {
      nested.checked = true;
    } });

    const page = new FakePage({
      inputLocator: input,
      labelsBySelector: {
        'label[for="nested-checkbox-1"]': nestedLabel,
      },
    }) as unknown as Page;

    await checkboxHandler(undefined, page, checkboxField, true);

    await expect(nested.isChecked()).resolves.toBe(true);
    expect(nestedLabel.clickCount).toBe(1);
  });
});
