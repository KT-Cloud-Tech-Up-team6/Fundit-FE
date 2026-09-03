import { redirect } from "next/navigation";

export default function SignupDonePage() {
  redirect("/auth/signup/complete");
}
