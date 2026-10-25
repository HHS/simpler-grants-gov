import { useStore } from "@nanostores/react";

import { $previewData } from "../../../stores/formPreview";

/** The JSON produced by the form preview, updated as the user types. */
export default function FormDataPanel() {
  const data = useStore($previewData);
  return (
    <pre className="form-preview__json" data-testid="live-preview-data">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
