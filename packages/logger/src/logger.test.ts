import { Logger, LogLevel } from "./logger";

describe("Logger Sentry Integration", () => {
  it("should NOT report to monitoring client when LogLevel.WARN is logged", () => {
    const mockMonitorClient = {
      reportError: jest.fn(),
    };

    const logger = new Logger({
      monitorClient: mockMonitorClient,
      reportErrors: true,
      minLevel: LogLevel.DEBUG,
    });

    logger.warn("Test warning message");

    // Verify no monitoring calls are made for warnings
    expect(mockMonitorClient.reportError).not.toHaveBeenCalled();
  });

  it("should call reportError when LogLevel.ERROR is logged", () => {
    const mockMonitorClient = {
      reportError: jest.fn(),
    };

    const logger = new Logger({
      monitorClient: mockMonitorClient,
      reportErrors: true,
    });

    logger.error("Test error message");

    expect(mockMonitorClient.reportError).toHaveBeenCalledWith("Test error message", {
      prefix: "",
      error: undefined,
      args: undefined,
    });
  });
});
