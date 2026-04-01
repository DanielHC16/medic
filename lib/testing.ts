export function isTestingWorkbenchEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_TEST_WORKBENCH === "true"
  );
}
