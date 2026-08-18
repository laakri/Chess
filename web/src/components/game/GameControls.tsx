import { Button } from "@/components/ui/button";
import { Flag, Handshake, RotateCcw, Settings, Shuffle } from "lucide-react";

interface GameControlsProps {
  onOfferDraw?: () => void;
  onFlipBoard?: () => void;
  onResign?: () => void;
  onReset?: () => void;
  onSettings?: () => void;
}

export function GameControls({ onOfferDraw, onFlipBoard, onResign, onReset, onSettings }: GameControlsProps) {
  return (
    <div className="grid w-full grid-cols-5 gap-2">
      <Button variant="outline" className="h-9 rounded-xl gap-2" onClick={onOfferDraw}>
        <Handshake className="size-4" />
        Draw
      </Button>
      <Button variant="outline" className="h-9 rounded-xl gap-2" onClick={onFlipBoard}>
        <Shuffle className="size-4" />
        Flip
      </Button>
      <Button variant="outline" className="h-9 rounded-xl gap-2" onClick={onReset}>
        <RotateCcw className="size-4" />
        Reset
      </Button>
      <Button variant="outline" className="h-9 rounded-xl gap-2" onClick={onSettings}>
        <Settings className="size-4" />
        Set
      </Button>
      <Button
        variant="outline"
        className="h-9 rounded-xl gap-2 hover:border-destructive hover:text-destructive"
        onClick={onResign}
      >
        <Flag className="size-4" />
        Resign
      </Button>
    </div>
  );
}
