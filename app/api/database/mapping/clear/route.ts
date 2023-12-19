import { NextRequest, NextResponse } from "next/server";
import { clearAllMapping } from "./utils";

export async function POST(req: NextRequest) {
    const {
        hosts,
    }: {
        hosts: string[];
    } = await req.json();
    try {
        const res = await clearAllMapping(hosts);
        return NextResponse.json(res);
    } catch (e: any) {
        return NextResponse.json({ error: e.message, raw: e });
    }
}
