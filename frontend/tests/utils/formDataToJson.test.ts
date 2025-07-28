import { isNull } from "node:util";

import { formDataToObject } from "src/components/applyForm/formDataToJson";

describe("formDataToObject", () => {
  it("correctly converts formData to object", () => {
    const formData = new FormData();
    formData.append("user.name", "Alice");
    formData.append("user.age", "30");
    formData.append("user.emptyString", "");
    formData.append("user.deeper.value", "hello");
    formData.append("user.skills[0]", "JavaScript");
    formData.append("user.skills[1]", "TypeScript");
    formData.append("user.skills[2].surprise", "more stuff");
    formData.append("nonUser", "false");
    formData.append("empty", "");
    formData.append("numeral", "100");

    const expected = {
      user: {
        age: 30,
        name: "Alice",
        emptyString: "",
        skills: ["JavaScript", "TypeScript", { surprise: "more stuff" }],
        deeper: {
          value: "hello",
        },
      },
      nonUser: false,
      empty: "",
      numeral: 100,
    };

    const result = formDataToObject(formData);

    expect(result).toEqual(expected);
  });
  it("handles falsey values", () => {
    const formData = new FormData();

    formData.append("something.whatever", "a value");

    const result = formDataToObject(formData);

    expect(result.any).toEqual(undefined);
    expect(result.something.somethingElse).toEqual(undefined);
  });
});
