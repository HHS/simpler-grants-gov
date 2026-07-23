interface PrintErrorDiagnosticsProps {
  applicationId: string;
  applicationFormId: string;
  errorCategory: "TopLevelError" | "NotFound" | "UnauthorizedError";
  hasInternalToken: boolean;
}

export default function PrintErrorDiagnostics({
  applicationId,
  applicationFormId,
  errorCategory,
  hasInternalToken,
}: PrintErrorDiagnosticsProps) {
  return (
    <main>
      <h1>PDF rendering failed</h1>

      <p>
        This document is an error diagnostic page, not a valid application form
        PDF.
      </p>

      <dl>
        <div>
          <dt>Application ID</dt>
          <dd>{applicationId}</dd>
        </div>

        <div>
          <dt>Application form ID</dt>
          <dd>{applicationFormId}</dd>
        </div>

        <div>
          <dt>Error category</dt>
          <dd>{errorCategory}</dd>
        </div>

        <div>
          <dt>Internal token present</dt>
          <dd>{hasInternalToken ? "Yes" : "No"}</dd>
        </div>
      </dl>
    </main>
  );
}
