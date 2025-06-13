const fakeBlobData = new Blob();
export const mockBlobGetData = jest.fn().mockResolvedValue(fakeBlobData);
export const mockBlobWriterInstance = jest.fn(() => ({
  getData: mockBlobGetData,
}));
export const mockZipWriterAdd = jest.fn();

const mockZipJs = {
  HttpReader: () => {},
  BlobWriter: () => mockBlobWriterInstance,
  ZipWriter: () => ({
    add: mockZipWriterAdd,
  }),
};

export default mockZipJs;
