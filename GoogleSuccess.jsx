import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("http://localhost:4000/api/auth/google/success", {
          credentials: "include"
        });

        const data = await res.json();

        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Erro no Google Login:", err);
      }
    }

    fetchUser();
  }, []);

  return (
    <div className="h-screen flex items-center justify-center text-neutral-700 dark:text-neutral-200">
      <p className="animate-pulse text-lg font-semibold">
        🔄 A autenticar com o Google...
      </p>
    </div>
  );
}
