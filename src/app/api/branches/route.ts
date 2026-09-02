import { NextResponse } from "next/server";
import { getDataSource } from "@/database/data-source";
import { Branch } from "@/database/entities";
import { apiError } from "@/lib/api";
import { pageResult, pagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const db = await getDataSource();
    const url = new URL(request.url);
    const options = pagination(Number(url.searchParams.get("page")), Number(url.searchParams.get("size")));
    const [content, totalElements] = await db.getRepository<Branch>("Branch").findAndCount({ where: { active: true }, order: { name: "ASC" }, select: { id: true, name: true }, skip: options.skip, take: options.size });
    return NextResponse.json(pageResult(content, totalElements, options.page, options.size));
  } catch (error) { return apiError(error); }
}
