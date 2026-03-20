import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (token) {
    redirect("/dashboard");
  }
  return <LandingPage />;
}
