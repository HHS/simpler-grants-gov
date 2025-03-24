// NOTE: this route is only for testing, will be removed when API is ready
// TODO: remove file
import { readError } from "src/errors";
import * as formSchema from "src/services/applyForm/data/formSchema.json";
import * as uiSchema from "src/services/applyForm/data/uiSchema.json";

const getFormDetails = () => {
  return JSON.parse(JSON.stringify(formSchema)) as object;
};

const getuiSchema = () => {
  const schema = uiSchema as unknown as { default: object };
  return schema.default;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ applicationId: string; appFormId: string }> },
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { applicationId, appFormId } = await params;

  try {
    const jsonFormSchema = getFormDetails();
    const uiSchema = getuiSchema();

    const response = {
      data: {
        form_id: "<some UUID>",
        form_name: "str",
        form_json_schema: jsonFormSchema,
        form_ui_schema: uiSchema,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error fetching saved opportunity: ${message}`,
      },
      { status },
    );
  }
}
