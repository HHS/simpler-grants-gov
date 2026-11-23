import { useStore } from "@nanostores/react";
import { generateXml, type XmlMapping } from "@xml/index.ts";
import { useMemo } from "react";

import {
  $dataView,
  $previewData,
  type DataView,
} from "../../../stores/formPreview";
import FileSelector from "../FileSelector";
import HighlightedCode from "./HighlightedCode";

/**
 * The preview has no uploads, so each attachment id stands in for its own file. The file
 * details are placeholders, written where the API writes the real upload's.
 */
const placeholderAttachment = (id: string) => ({
  fileName: `${id}.pdf`,
  mimeType: "application/pdf",
  fileLocation: `${id}.pdf`,
  hashValue: "placeholder",
});

const VIEWS: { value: DataView; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
];

/**
 * What the form preview produces, updated as the user types: the JSON response, and, for a
 * form mapped to its XSD, the Grants.gov XML its `xml-mapping.json` builds from it.
 */
export default function FormDataPanel({
  xmlMapping,
}: {
  xmlMapping?: XmlMapping;
}) {
  const data = useStore($previewData);
  const view = useStore($dataView);

  const xml = useMemo(() => {
    if (!xmlMapping) return undefined;
    try {
      return generateXml(xmlMapping, data, {
        attachment: placeholderAttachment,
      });
    } catch (error) {
      return `<!-- The XML can't be built from these answers yet: ${String(error)} -->`;
    }
  }, [xmlMapping, data]);

  return (
    <>
      {xml !== undefined && (
        <FileSelector
          label="Data format"
          options={VIEWS}
          value={view}
          onChange={(value) => $dataView.set(value)}
        />
      )}
      {view === "xml" && xml !== undefined ? (
        <HighlightedCode code={xml} lang="xml" />
      ) : (
        <HighlightedCode code={JSON.stringify(data, null, 2)} lang="json" />
      )}
    </>
  );
}
