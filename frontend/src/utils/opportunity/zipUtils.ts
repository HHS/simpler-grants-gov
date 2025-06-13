import * as zip from "@zip.js/zip.js";
import { OpportunityDocument } from "src/types/opportunity/opportunityResponseTypes";

type ZipEntry = [string, zip.HttpReader];

const splitFilenameRegexp = /(.+)+\.(.+)/;
const fileNameSequenceRegexp = /(.*)\((\w+)\)$/;

// adds a numerical "sequence" to the filename to deduplicate it from other files with the same name
// ex. filename.txt -> filename(1).txt
// ex. filename(1).txt -> filename(2).txt
export const deduplicateFilename = (claimedFilename: string) => {
  const splitMatch = claimedFilename.match(splitFilenameRegexp);
  // need to handle cases without  a file extension
  const name = splitMatch ? splitMatch[1] : claimedFilename;
  const extension = splitMatch ? `.${splitMatch[2]}` : "";
  const sequenceMatch = name.match(fileNameSequenceRegexp);
  if (!sequenceMatch || !sequenceMatch[2]) {
    return `${name}(1)${extension}`;
  }
  const [__, unsequencedName, sequence] = sequenceMatch;
  return `${unsequencedName}(${parseInt(sequence) + 1})${extension}`;
};

export const attachmentsToZipEntries = (
  attachments: OpportunityDocument[],
): ZipEntry[] => {
  if (!attachments || !attachments.length) {
    return [];
  }
  const entries = attachments.reduce(
    (acc, attachment) => {
      const { zipEntries, claimedFilenames } = acc;
      const claimedFilename = claimedFilenames.find(
        (claimedFilename) => claimedFilename === attachment.file_name,
      );
      const zipFilename = claimedFilename
        ? deduplicateFilename(claimedFilename)
        : attachment.file_name;
      claimedFilenames.push(zipFilename);
      zipEntries.push([
        zipFilename,
        new zip.HttpReader(attachment.download_path),
      ]);
      return { zipEntries, claimedFilenames };
    },
    { zipEntries: [], claimedFilenames: [] } as {
      zipEntries: ZipEntry[];
      claimedFilenames: string[];
    },
  );
  return entries.zipEntries;
};
