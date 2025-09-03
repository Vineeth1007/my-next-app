import { useEffect } from "react";
import { useRouter } from "next/router";

export default function RedirectToSection() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/#playground");
  }, [router]);
  return null;
}
