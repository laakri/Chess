import { Button } from "@/components/ui/button";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider.tsx";
import blacklogo from "@/assets/logo-black.png";
import whitelogo from "@/assets/logo-white.png";

export default function Home() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="absolute top-4 right-4">
        <button
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 rounded-full border bg-background/50 hover:shadow"
        >
          {theme === "dark" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>
      </div>
      <div className="mx-auto max-w-2xl text-center">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img src={blacklogo} className="h-24 block dark:hidden" />
          <img src={whitelogo} className="h-24 hidden dark:block" />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-semibold leading-tight">
          Kech Malik
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          3asba lih.
        </p>

        {/* Actions */}
        <div className="mt-10 flex justify-center gap-4">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => navigate("/play")}
          >
            Play
            <ArrowRight className="size-4" />
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onClick={() => navigate("/settings")}
          >
            Settings
          </Button>
        </div>

      </div>
    </main>
  );
}