import { useStore } from "@nanostores/react";
import { generateXml, type XmlMapping } from "@xml/index.ts";
import { useMemo } from "react";

import {
  $dataView,
  $previewData,
  type DataView,
} from "../../../stores/formPreview";
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

const VIEWS: { view: DataView; label: string }[] = [
  { view: "json", label: "JSON" },
  { view: "xml", label: "XML" },
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
        <ul className="usa-button-group usa-button-group--segmented margin-bottom-2">
          {VIEWS.map(({ view: option, label }) => (
            <li key={option} className="usa-button-group__item">
              <button
                type="button"
                className={`usa-button${option === view ? "" : " usa-button--outline"}`}
                aria-pressed={option === view}
                onClick={() => $dataView.set(option)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {view === "xml" && xml !== undefined ? (
        <HighlightedCode code={xml} lang="xml" />
      ) : (
        <HighlightedCode code={JSON.stringify(data, null, 2)} lang="json" />
      )}
    </>
  );
}
