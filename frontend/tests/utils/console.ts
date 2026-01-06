type ConsoleMethod = "error" | "warn" | "log";

export function silenceConsole(method: ConsoleMethod = "error") {
  return jest
    .spyOn(console, method)
    .mockImplementation((): void => undefined);
}
