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
  ArrowLeft,
} from "lucide-react";
import { getSocket, joinRoom, leaveRoom, sendDrawingEvent, sendClearBoard } from "@/lib/socket";

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

  // Join room for real-time sync, leave on unmount
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    let joined = false;

    const doJoin = () => {
      if (!joined && socket.connected) {
        joined = true;
        joinRoom(roomId);
      }
    };

    // Join immediately if connected, or wait for connect
    if (socket.connected) {
      doJoin();
    }
    socket.on("connect", doJoin);

    const handleDrawing = ({ strokeData }: { userId: string; strokeData: Stroke }) => {
      setStrokes((prev) => [...prev, strokeData]);
    };

    const handleClear = () => {
      setStrokes([]);
      setRedoStack([]);
    };

    socket.on("drawing_event", handleDrawing);
    socket.on("clear_board", handleClear);

    return () => {
      socket.off("connect", doJoin);
      socket.off("drawing_event", handleDrawing);
      socket.off("clear_board", handleClear);
      if (joined) {
        leaveRoom(roomId);
      }
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
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-border bg-surface/60 px-4 py-2 backdrop-blur-xl sm:px-6 sm:py-3">
        <div className="flex items-center gap-3">
          {roomId && (
            <button
              onClick={() => window.history.back()}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className="text-sm font-semibold text-foreground">Whiteboard</h1>
            <p className="text-xs text-muted-foreground">
              {strokes.length} stroke{strokes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full border-2 transition-transform sm:h-6 sm:w-6 ${
                color === c ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="ml-1 flex items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-1 sm:ml-2 sm:px-2">
            <Minus className="h-3 w-3 text-muted-foreground" />
            <input
              type="range"
              min={1}
              max={20}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-12 accent-[#6EEB83] sm:w-16"
            />
            <Plus className="h-3 w-3 text-muted-foreground" />
            <span className="ml-1 text-[10px] text-muted-foreground sm:text-xs">{size}px</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="absolute inset-0 pt-[52px] sm:pt-[57px]">
        <canvas
          ref={canvasRef}
          className={`${tool === "eraser" ? "cursor-cell" : "cursor-crosshair"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Left toolbar */}
      <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2 sm:left-5">
        <div className="glass-strong flex flex-col items-center gap-0.5 rounded-2xl p-1.5 sm:gap-1 sm:p-2">
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
              className={`grid h-9 w-9 place-items-center rounded-xl transition-colors sm:h-10 sm:w-10 ${
                tool === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}
          <div className="my-0.5 h-px w-5 bg-border sm:my-1 sm:w-6" />
          <button
            onClick={handleUndo}
            title="Undo"
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-card hover:text-foreground sm:h-10 sm:w-10"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            title="Redo"
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-card hover:text-foreground sm:h-10 sm:w-10"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            title="Clear"
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:h-10 sm:w-10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="glass-strong absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-full p-1 sm:bottom-5 sm:right-5">
        <button className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground sm:h-8 sm:w-8">
          <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
        <span className="px-1.5 text-[10px] text-muted-foreground sm:px-2 sm:text-xs">100%</span>
        <button className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground sm:h-8 sm:w-8">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  );
}
