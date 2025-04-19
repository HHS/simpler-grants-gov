import { RJSFSchema } from "@rjsf/utils";

import { shapeFormData } from "src/components/applyForm/utils";
import { validateFormSchema } from "src/components/applyForm/validate";

describe("shapeFormData", () => {
  it("should shape form data to the form schema", () => {
    const formSchema: RJSFSchema = {
      title: "test schema",
      properties: {
        name: { type: "string", title: "test name", maxLength: 60 },
        dob: { type: "string", format: "date", title: "Date of birth" },
        address: { type: "string", title: "test address" },
        state: { type: "string", title: "test state" },
      },
      required: ["name"],
    };

    const shapedFormData = {
      name: "test",
      dob: "01/01/1900",
      address: "test street",
      state: "PA",
    };

    const formData = new FormData();
    formData.append("dob", "01/01/1900");
    formData.append("address", "test street");
    formData.append("name", "test");
    formData.append("state", "PA");

    const data = shapeFormData(formData, formSchema);

    expect(data).toMatchObject(shapedFormData);
  });
  it("should shape nested form data", () => {
    const formSchema: RJSFSchema = {
      type: "object",
      title: "test schema",
      properties: {
        name: { type: "string", title: "test name", maxLength: 60 },
        dob: { type: "string", format: "date", title: "Date of birth" },
        address: {
          type: "object",
          properties: {
            street: { type: "string", title: "street" },
            zip: { type: "number", title: "zip code" },
            state: { type: "string", title: "test state" },
            question: {
              type: "object",
              properties: {
                own: { type: "string", title: "own" },
                rent: { type: "string", title: "rent" },
                other: { type: "string", title: "other" },
              },
            },
          },
        },
        tasks: {
          type: "array",
          title: "Tasks",
          items: {
            type: "object",
            required: ["title"],
            properties: {
              title: {
                type: "string",
                title: "Important task",
              },
              done: {
                type: "boolean",
                title: "Done?",
                default: false,
              },
            },
          },
        },
        todos: {
          type: "array",
          title: "Tasks",
          items: {
            type: "string",
            title: "Reminder",
          },
        },
      },
      required: ["name"],
    };

    const shapedFormData = {
      name: "test",
      dob: "01/01/1900",
      address: {
        street: "test street",
        zip: "1234",
        state: "XX",
        question: {
          rent: "yes",
        },
      },
      tasks: [
        {
          title: "Submit form",
          done: "false",
        },
        {
          title: "Start form",
          done: "true",
        },
      ],
      todos: ["email", "write"],
    };

    validateFormSchema(formSchema);

    const formData = new FormData();
    formData.append("street", "test street");
    formData.append("name", "test");
    formData.append("state", "XX");
    formData.append("zip", "1234");
    formData.append("dob", "01/01/1900");
    formData.append("rent", "yes");
    const tasks: Array<{ title: string; done: string }> = [
      { title: "Submit form", done: "false" },
      { title: "Start form", done: "true" },
    ];

    tasks.forEach((obj, index) => {
      (Object.keys(obj) as Array<keyof typeof obj>).forEach((key) => {
        formData.append(`tasks[${index}][${key}]`, String(obj[key]));
      });
    });
    formData.append("todos[0]", "email");
    formData.append("todos[1]", "write");

    const data = shapeFormData(formData, formSchema);
    expect(data).toMatchObject(shapedFormData);
  });
});
