import { createNeonAuth } from "@neondatabase/auth/next/server";

import { getNeonAuthBaseUrl, getNeonAuthCookieSecret } from "@/lib/env";

export const neonAuth = createNeonAuth({
  baseUrl: getNeonAuthBaseUrl(),
  cookies: {
    secret: getNeonAuthCookieSecret(),
  },
});

