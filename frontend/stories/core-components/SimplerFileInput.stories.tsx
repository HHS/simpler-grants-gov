import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";

const meta = {
  title: "Core Components/SimplerFileInput",
  component: SimplerFileInput,
};
export default meta;

const defaultArgs = {
  postUploadAction: () => Promise.resolve(),
  postUploadActionProgressMessage: "Post upload action in progress",
  postUploadActionSuccessMessage: "Upload success",
  postUploadActionErrorMessage: "Upload error",
  onDelete: (_fileId: string) => {
    // eslint-disable-next-line no-console
    console.log("Deleting file");
    return Promise.resolve();
  },
  onError: (_err: Error) => console.error("Error!"),
  // eslint-disable-next-line no-console
  onSuccess: () => console.log("Success!"),
  // eslint-disable-next-line no-console
  onStart: () => console.log("Upload started!"),
  // eslint-disable-next-line no-console
  onComplete: () => console.log("Upload complete!"),
  id: "1",
  existingFiles: [],
  required: false,
  disabled: false,
  readOnly: false,
  describedByIds: [],
  multiFile: false,
};

export const Default = {
  args: defaultArgs,
};

export const Disabled = (): React.ReactElement => (
  <SimplerFileInput {...defaultArgs} disabled={true} />
);

export const DisabledExistingFiles = (): React.ReactElement => (
  <SimplerFileInput
    {...defaultArgs}
    disabled={true}
    existingFiles={[
      {
        id: "1",
        fileName: "file.txt",
        updatedAt: new Date().toString(),
      },
    ]}
  />
);

export const ReadOnlyExistingFiles = (): React.ReactElement => (
  <SimplerFileInput
    {...defaultArgs}
    readOnly={true}
    existingFiles={[
      {
        id: "1",
        fileName: "file.txt",
        updatedAt: new Date().toString(),
      },
    ]}
  />
);

export const MultiFile = (): React.ReactElement => (
  <SimplerFileInput {...defaultArgs} multiFile={true} />
);
