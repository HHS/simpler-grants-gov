/*
  This file is for client only utils. If you have a util that is acting up when you try and include it in a file
  that is being run server side, you can put it here.
  */

// a hack to get filenames to work on blob based downloads across all browsers
// see https://stackoverflow.com/a/48968694
export const saveBlobToFile = (blob: Blob, filename: string) => {
  const temporaryLink = document.createElement("a");
  document.body.appendChild(temporaryLink);
  const url = window.URL.createObjectURL(blob);
  temporaryLink.href = url;
  temporaryLink.download = filename;
  temporaryLink.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(temporaryLink);
  }, 0);
};
