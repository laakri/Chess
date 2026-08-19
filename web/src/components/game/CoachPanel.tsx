import { Bot } from "lucide-react";
import type { MoveFeedback } from "@/types/chess";

interface CoachPanelProps {
  feedback: MoveFeedback | null;
  botThinking: boolean;
}

export function CoachPanel({ feedback, botThinking }: CoachPanelProps) {
  const message = botThinking
    ? "I am thinking about my reply."
    : feedback?.detail ?? "Make a move and I will tell you how it changed the position.";

  return (
    <div className="mb-4 flex items-start gap-2 px-1">
      <Bot className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 text-xs leading-5">
        <div className="font-semibold text-foreground">Coach</div>
        <div className="text-muted-foreground">{message}</div>
        {feedback && (
          <div
            className={`mt-1 font-semibold ${
              feedback.quality === "best" || feedback.quality === "good"
                ? "text-emerald-600"
                : feedback.quality === "inaccuracy"
                  ? "text-amber-600"
                  : "text-red-600"
            }`}
          >
            {feedback.label}
          </div>
        )}
      </div>
    </div>
  );
}
