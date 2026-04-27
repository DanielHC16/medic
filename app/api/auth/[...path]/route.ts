import { neonAuth } from "@/lib/auth/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { DELETE, GET, PATCH, POST, PUT } = neonAuth.handler();

