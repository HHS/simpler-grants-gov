import * as zip from "@zip.js/zip.js";
import { OpportunityDocument } from "src/types/opportunity/opportunityResponseTypes";

type ZipEntry = [string, zip.HttpReader];

const splitFilenameRegexp = /(.+)+\.(.+)/;

// adds a numerical "sequence" to the filename to deduplicate it from other files with the same name
// ex. filename.txt -> filename(1).txt
// ex. filename(1).txt -> filename(2).txt
export const deduplicateFilename = (
  filename: string,
  claimedFilenames: { [key: string]: number },
) => {
  const claimedFilename = Object.keys(claimedFilenames).find(
    (claimedFilename) => claimedFilename === filename,
  );
  if (!claimedFilename) {
    return filename;
  }

  const currentSequence = claimedFilenames[filename];

  const splitMatch = claimedFilename.match(splitFilenameRegexp);
  // need to handle cases without a file extension
  const name = splitMatch ? splitMatch[1] : claimedFilename;
  const extension = splitMatch ? `.${splitMatch[2]}` : "";

  return `${name}(${currentSequence})${extension}`;
};

// this is here mainly to handle deduplicating filenames to be added to a zip file
export const attachmentsToZipEntries = (
  attachments: OpportunityDocument[],
): ZipEntry[] => {
  if (!attachments || !attachments.length) {
    return [];
  }
  const entries = attachments.reduce(
    (acc, attachment) => {
      const { zipEntries, claimedFilenames } = acc;
      const zipFilename = deduplicateFilename(
        attachment.file_name,
        claimedFilenames,
      );
      claimedFilenames[attachment.file_name] = claimedFilenames[
        attachment.file_name
      ]
        ? claimedFilenames[attachment.file_name] + 1
        : 1;
      zipEntries.push([
        zipFilename,
        new zip.HttpReader(attachment.download_path),
      ]);
      return { zipEntries, claimedFilenames };
    },
    { zipEntries: [], claimedFilenames: {} } as {
      zipEntries: ZipEntry[];
      claimedFilenames: { [key: string]: number };
    },
  );
  return entries.zipEntries;
};
