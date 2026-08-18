import { SettingsPanel } from "@/components/game/SettingsPanel";
import { Button } from "@/components/ui/button";
import { useGameSettings } from "@/hooks/useGameSettings";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSetting, resetSettings } = useGameSettings();

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/play")}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <SettingsIcon className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">Customize the board, panels, and local game behavior.</p>
            </div>
          </div>
        </div>

        <SettingsPanel settings={settings} onSettingChange={updateSetting} onReset={resetSettings} />
      </div>
    </main>
  );
}
