const fakeBlobData = new Blob();
export const mockBlobGetData = jest.fn().mockResolvedValue(fakeBlobData);
export const mockBlobWriterInstance = jest.fn(() => ({
  getData: mockBlobGetData,
}));
export const mockZipWriterAdd = jest.fn();

const mockZipWriterConstructor = jest.fn();
const mockBlobConstructor = jest.fn();
const mockHttpReaderConstructor = jest.fn();
const mockZipWriterClose = jest.fn();

class FakeBlobWriter {
  constructor() {
    mockBlobConstructor();
  }

  public getData = mockBlobGetData;
}

class FakeZipWriter {
  constructor() {
    mockZipWriterConstructor();
  }

  public add = mockZipWriterAdd;

  public close = mockZipWriterClose;
}

export class FakeHttpReader {
  constructor() {
    mockHttpReaderConstructor();
  }
}

export const HttpReader = FakeHttpReader;
export const BlobWriter = FakeBlobWriter;
export const ZipWriter = FakeZipWriter;
