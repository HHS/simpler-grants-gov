import { DataFetcher } from "./datafetcher";

export class MockDataFetcher<T> extends DataFetcher<T> {
  constructor(private mockData: T[]) {
    super();
  }

  async fetchData(): Promise<T[]> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 500));
    return this.mockData;
  }
}
