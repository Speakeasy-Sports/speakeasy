import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeReturnPath } from "@/lib/safe-return-path";

export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  redirect(safeReturnPath(request.nextUrl.searchParams.get("to"), request.nextUrl.origin));
}
