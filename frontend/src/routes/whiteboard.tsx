import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  Pen,
  Eraser,
  Square,
  Circle as CircleIcon,
  Undo2,
  Redo2,
  Trash2,
  Minus,
  Plus,
} from "lucide-react";
import { getSocket, sendDrawingEvent, sendClearBoard } from "@/lib/socket";

export const Route = createFileRoute("/whiteboard")({
  head: () => ({
    meta: [
      { title: "Whiteboard — SyncSpace" },
      { name: "description", content: "Collaborate on an infinite canvas." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    roomId: (search.roomId as string) || undefined,
  }),
  component: Whiteboard,
});

type Tool = "pen" | "eraser" | "rect" | "circle";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  tool: Tool;
  color: string;
  size: number;
  points: Point[];
  start?: Point;
  end?: Point;
}

const COLORS = [
  "#6EEB83",
  "#F8FAFC",
  "#F43F5E",
  "#3B82F6",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

function Whiteboard() {
  const { roomId } = Route.useSearch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#6EEB83");
  const [size, setSize] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  const generateId = () => Math.random().toString(36).slice(2, 10);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    ctx.strokeStyle = stroke.tool === "eraser" ? "#1a1a2e" : stroke.color;
    ctx.lineWidth = stroke.tool === "eraser" ? stroke.size * 4 : stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (stroke.tool === "pen" || stroke.tool === "eraser") {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const mid = {
          x: (stroke.points[i - 1].x + stroke.points[i].x) / 2,
          y: (stroke.points[i - 1].y + stroke.points[i].y) / 2,
        };
        ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, mid.x, mid.y);
      }
      ctx.stroke();
    } else if (stroke.tool === "rect" && stroke.start && stroke.end) {
      ctx.strokeRect(
        stroke.start.x,
        stroke.start.y,
        stroke.end.x - stroke.start.x,
        stroke.end.y - stroke.start.y,
      );
    } else if (stroke.tool === "circle" && stroke.start && stroke.end) {
      const rx = Math.abs(stroke.end.x - stroke.start.x) / 2;
      const ry = Math.abs(stroke.end.y - stroke.start.y) / 2;
      const cx = stroke.start.x + (stroke.end.x - stroke.start.x) / 2;
      const cy = stroke.start.y + (stroke.end.y - stroke.start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, []);

  const redraw = useCallback(
    (ctx: CanvasRenderingContext2D, allStrokes: Stroke[]) => {
      const canvas = ctx.canvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const stroke of allStrokes) {
        drawStroke(ctx, stroke);
      }
    },
    [drawStroke],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        redraw(ctx, strokes);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [strokes, redraw]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    const handleDrawing = ({ userId, strokeData }: { userId: string; strokeData: Stroke }) => {
      setStrokes((prev) => [...prev, strokeData]);
    };

    const handleClear = () => {
      setStrokes([]);
      setRedoStack([]);
    };

    socket.on("drawing_event", handleDrawing);
    socket.on("clear_board", handleClear);

    return () => {
      socket.off("drawing_event", handleDrawing);
      socket.off("clear_board", handleClear);
    };
  }, [roomId]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    setIsDrawing(true);

    const stroke: Stroke = {
      id: generateId(),
      tool,
      color,
      size,
      points: [point],
      start: point,
      end: point,
    };
    setCurrentStroke(stroke);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    const point = getCanvasPoint(e);

    if (currentStroke.tool === "pen" || currentStroke.tool === "eraser") {
      const updated = {
        ...currentStroke,
        points: [...currentStroke.points, point],
      };
      setCurrentStroke(updated);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawStroke(ctx, updated);
          ctx.restore();
        }
      }
    } else {
      const updated = { ...currentStroke, end: point };
      setCurrentStroke(updated);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          redraw(ctx, strokes);
          drawStroke(ctx, updated);
          ctx.restore();
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);

    setStrokes((prev) => [...prev, currentStroke]);
    setRedoStack([]);

    if (roomId) {
      sendDrawingEvent(roomId, currentStroke);
    }

    setCurrentStroke(null);
  };

  const handleUndo = () => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setStrokes((s) => [...s, last]);
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setStrokes([]);
    setRedoStack([]);
    if (roomId) sendClearBoard(roomId);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#1a1a2e]">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-border bg-surface/60 px-6 py-3 backdrop-blur-xl">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Whiteboard</h1>
          <p className="text-xs text-muted-foreground">
            {strokes.length} stroke{strokes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 transition-transform ${
                color === c ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="ml-2 flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1">
            <Minus className="h-3 w-3 text-muted-foreground" />
            <input
              type="range"
              min={1}
              max={20}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-16 accent-[#6EEB83]"
            />
            <Plus className="h-3 w-3 text-muted-foreground" />
            <span className="ml-1 text-xs text-muted-foreground">{size}px</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="absolute inset-0 pt-[57px]">
        <canvas
          ref={canvasRef}
          className={`${
            tool === "eraser"
              ? "cursor-cell"
              : tool === "pen"
                ? "cursor-crosshair"
                : "cursor-crosshair"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Left toolbar */}
      <div className="absolute left-5 top-1/2 z-20 -translate-y-1/2">
        <div className="glass-strong flex flex-col items-center gap-1 rounded-2xl p-2">
          {(
            [
              { id: "pen", icon: Pen, label: "Pen" },
              { id: "eraser", icon: Eraser, label: "Eraser" },
              { id: "rect", icon: Square, label: "Rectangle" },
              { id: "circle", icon: CircleIcon, label: "Circle" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                tool === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}
          <div className="my-1 h-px w-6 bg-border" />
          <button
            onClick={handleUndo}
            title="Undo"
            className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-card hover:text-foreground"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            title="Redo"
            className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-card hover:text-foreground"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            title="Clear"
            className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="glass-strong absolute bottom-5 right-5 z-20 flex items-center gap-1 rounded-full p-1">
        <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground">
          <Minus className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs text-muted-foreground">100%</span>
        <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
