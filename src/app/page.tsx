import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";

export default async function Home() {
  redirect((await readSession()) ? "/dashboard" : "/login");
}
