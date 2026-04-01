export function placeholderResponse(options: {
  feature: string;
  method: string;
  path: string;
  summary: string;
}) {
  return Response.json({
    ok: true,
    status: "placeholder",
    feature: options.feature,
    method: options.method,
    path: options.path,
    summary: options.summary,
    message:
      "Route scaffold created successfully. Business logic will be added after the phase-one database foundation.",
  });
}
