import { useEffect, useRef, useState, useCallback } from "react";

// Skeleton joint positions for a squat exercise (normalized 0-1 coordinates)
const SQUAT_FRAMES = [
  {
    joints: {
      head: [0.5, 0.08], neck: [0.5, 0.16],
      leftShoulder: [0.38, 0.22], rightShoulder: [0.62, 0.22],
      leftElbow: [0.32, 0.36], rightElbow: [0.68, 0.36],
      leftWrist: [0.30, 0.50], rightWrist: [0.70, 0.50],
      leftHip: [0.42, 0.50], rightHip: [0.58, 0.50],
      leftKnee: [0.42, 0.70], rightKnee: [0.58, 0.70],
      leftAnkle: [0.42, 0.90], rightAnkle: [0.58, 0.90],
    },
    feedback: { text: "Good starting position", color: "#22c55e", score: 98, type: "success" },
  },
  {
    joints: {
      head: [0.5, 0.12], neck: [0.5, 0.20],
      leftShoulder: [0.37, 0.26], rightShoulder: [0.63, 0.26],
      leftElbow: [0.28, 0.38], rightElbow: [0.72, 0.38],
      leftWrist: [0.26, 0.50], rightWrist: [0.74, 0.50],
      leftHip: [0.41, 0.53], rightHip: [0.59, 0.53],
      leftKnee: [0.40, 0.72], rightKnee: [0.60, 0.72],
      leftAnkle: [0.41, 0.90], rightAnkle: [0.59, 0.90],
    },
    feedback: { text: "Keep chest up", color: "#f59e0b", score: 85, type: "warning" },
  },
  {
    joints: {
      head: [0.5, 0.20], neck: [0.5, 0.28],
      leftShoulder: [0.36, 0.34], rightShoulder: [0.64, 0.34],
      leftElbow: [0.26, 0.44], rightElbow: [0.74, 0.44],
      leftWrist: [0.24, 0.54], rightWrist: [0.76, 0.54],
      leftHip: [0.40, 0.58], rightHip: [0.60, 0.58],
      leftKnee: [0.36, 0.74], rightKnee: [0.64, 0.74],
      leftAnkle: [0.40, 0.90], rightAnkle: [0.60, 0.90],
    },
    feedback: { text: "Knees tracking over toes ✓", color: "#22c55e", score: 92, type: "success" },
  },
  {
    joints: {
      head: [0.5, 0.28], neck: [0.5, 0.36],
      leftShoulder: [0.35, 0.42], rightShoulder: [0.65, 0.42],
      leftElbow: [0.24, 0.50], rightElbow: [0.76, 0.50],
      leftWrist: [0.22, 0.58], rightWrist: [0.78, 0.58],
      leftHip: [0.39, 0.62], rightHip: [0.61, 0.62],
      leftKnee: [0.33, 0.76], rightKnee: [0.67, 0.76],
      leftAnkle: [0.39, 0.90], rightAnkle: [0.61, 0.90],
    },
    feedback: { text: "Go deeper — thighs parallel to ground", color: "#f59e0b", score: 78, type: "warning" },
  },
  {
    joints: {
      head: [0.5, 0.20], neck: [0.5, 0.28],
      leftShoulder: [0.36, 0.34], rightShoulder: [0.64, 0.34],
      leftElbow: [0.26, 0.44], rightElbow: [0.74, 0.44],
      leftWrist: [0.24, 0.54], rightWrist: [0.76, 0.54],
      leftHip: [0.40, 0.58], rightHip: [0.60, 0.58],
      leftKnee: [0.36, 0.74], rightKnee: [0.64, 0.74],
      leftAnkle: [0.40, 0.90], rightAnkle: [0.60, 0.90],
    },
    feedback: { text: "Drive through heels ✓", color: "#22c55e", score: 94, type: "success" },
  },
  {
    joints: {
      head: [0.5, 0.08], neck: [0.5, 0.16],
      leftShoulder: [0.38, 0.22], rightShoulder: [0.62, 0.22],
      leftElbow: [0.32, 0.36], rightElbow: [0.68, 0.36],
      leftWrist: [0.30, 0.50], rightWrist: [0.70, 0.50],
      leftHip: [0.42, 0.50], rightHip: [0.58, 0.50],
      leftKnee: [0.42, 0.70], rightKnee: [0.58, 0.70],
      leftAnkle: [0.42, 0.90], rightAnkle: [0.58, 0.90],
    },
    feedback: { text: "Good squat!", color: "#22c55e", score: 96, type: "success" },
  },
];

const REP_SUMMARIES = [
  { type: "warning", message: "Rep 1 — Go deeper: aim for thighs parallel to ground" },
  { type: "success", message: "Rep 2 — Good squat! Keep chest up on descent" },
  { type: "success", message: "Rep 3 — Good depth! Knees tracking well" },
  { type: "warning", message: "Rep 4 — Knees too far forward — push hips back" },
  { type: "success", message: "Rep 5 — Good squat!" },
];

const BONES = [
  ["head", "neck"],
  ["neck", "leftShoulder"], ["neck", "rightShoulder"],
  ["leftShoulder", "leftElbow"], ["rightShoulder", "rightElbow"],
  ["leftElbow", "leftWrist"], ["rightElbow", "rightWrist"],
  ["leftShoulder", "leftHip"], ["rightShoulder", "rightHip"],
  ["leftHip", "rightHip"],
  ["leftHip", "leftKnee"], ["rightHip", "rightKnee"],
  ["leftKnee", "leftAnkle"], ["rightKnee", "rightAnkle"],
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpJoints(
  from: Record<string, number[]>,
  to: Record<string, number[]>,
  t: number
): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  for (const key of Object.keys(from)) {
    result[key] = [lerp(from[key][0], to[key][0], t), lerp(from[key][1], to[key][1], t)];
  }
  return result;
}

type FeedbackEntry = { type: string; message: string; time: string };

export default function FormAnalysisShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const isPlayingRef = useRef(true);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const repCountRef = useRef(0);
  const sessionSecondsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentFeedback, setCurrentFeedback] = useState(SQUAT_FRAMES[0].feedback);
  const [repCount, setRepCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEntry[]>([
    { type: "success", message: "Session started — Bodyweight Squat selected", time: "0:00" },
  ]);

  const drawFrame = useCallback((canvas: HTMLCanvasElement, joints: Record<string, number[]>, feedback: typeof SQUAT_FRAMES[0]["feedback"]) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Dark navy background — always visible
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = "rgba(34,197,94,0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Floor line
    ctx.strokeStyle = "rgba(34,197,94,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.1, H * 0.92);
    ctx.lineTo(W * 0.9, H * 0.92);
    ctx.stroke();

    // Score arc
    const score = feedback.score;
    const scoreColor = score >= 90 ? "#22c55e" : score >= 75 ? "#f59e0b" : "#ef4444";
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.18, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.18, 28, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * score) / 100);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${score}`, W * 0.85, H * 0.18 + 5);

    // Draw bones — green limbs
    ctx.shadowColor = "#22c55e";
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (const [a, b] of BONES) {
      const jA = joints[a];
      const jB = joints[b];
      if (!jA || !jB) continue;
      ctx.beginPath();
      ctx.moveTo(jA[0] * W, jA[1] * H);
      ctx.lineTo(jB[0] * W, jB[1] * H);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Draw joints — red
    for (const [key, pos] of Object.entries(joints)) {
      const x = pos[0] * W;
      const y = pos[1] * H;
      const isLarge = key.includes("Knee") || key.includes("Hip") || key === "head";
      const radius = isLarge ? 7 : 5;

      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Feedback pill
    const pillColor = feedback.color;
    const pillW = Math.min(W * 0.82, 240);
    const pillH = 30;
    const pillX = (W - pillW) / 2;
    const pillY = H * 0.03;
    ctx.fillStyle = pillColor + "25";
    ctx.strokeStyle = pillColor + "99";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    (ctx as CanvasRenderingContext2D).roundRect(pillX, pillY, pillW, pillH, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pillColor;
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(feedback.text, W / 2, pillY + 20);
  }, []);

  // Main animation loop — uses refs only, no closure variables
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const FRAME_DURATION = 600;
    const TOTAL_DURATION = SQUAT_FRAMES.length * FRAME_DURATION;

    lastTimeRef.current = performance.now();

    function animate(now: number) {
      if (!isPlayingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const delta = Math.min(now - lastTimeRef.current, 100); // cap delta to avoid jumps
      lastTimeRef.current = now;
      timeRef.current = (timeRef.current + delta) % TOTAL_DURATION;

      const rawFrame = timeRef.current / FRAME_DURATION;
      const frameIndex = Math.floor(rawFrame) % SQUAT_FRAMES.length;
      const nextIndex = (frameIndex + 1) % SQUAT_FRAMES.length;
      const t = rawFrame - Math.floor(rawFrame);

      const currentFrame = SQUAT_FRAMES[frameIndex];
      const nextFrame = SQUAT_FRAMES[nextIndex];
      const interpolated = lerpJoints(currentFrame.joints, nextFrame.joints, t);

      drawFrame(canvas, interpolated, currentFrame.feedback);
      setCurrentFeedback(currentFrame.feedback);

      // Count reps at the last frame transition
      if (frameIndex === SQUAT_FRAMES.length - 1 && t < 0.05) {
        repCountRef.current += 1;
        const newRep = repCountRef.current;
        setRepCount(newRep);

        const summaryIndex = (newRep - 1) % REP_SUMMARIES.length;
        const summary = REP_SUMMARIES[summaryIndex];
        const mins = Math.floor(sessionSecondsRef.current / 60);
        const secs = sessionSecondsRef.current % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

        setFeedbackHistory(prev => [
          { type: summary.type, message: summary.message, time: timeStr },
          ...prev,
        ].slice(0, 12));
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    // Draw first frame immediately so canvas is never blank
    const firstFrame = SQUAT_FRAMES[0];
    drawFrame(canvas, firstFrame.joints, firstFrame.feedback);

    if (isPlayingRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame]);

  // Session timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        sessionSecondsRef.current += 1;
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => {
      const next = !prev;
      isPlayingRef.current = next;
      if (next) {
        // Restart animation loop
        const canvas = canvasRef.current;
        if (!canvas) return next;
        lastTimeRef.current = performance.now();
        const FRAME_DURATION = 600;
        const TOTAL_DURATION = SQUAT_FRAMES.length * FRAME_DURATION;

        const animate = (now: number) => {
          if (!isPlayingRef.current) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const delta = Math.min(now - lastTimeRef.current, 100);
          lastTimeRef.current = now;
          timeRef.current = (timeRef.current + delta) % TOTAL_DURATION;
          const rawFrame = timeRef.current / FRAME_DURATION;
          const frameIndex = Math.floor(rawFrame) % SQUAT_FRAMES.length;
          const nextIndex = (frameIndex + 1) % SQUAT_FRAMES.length;
          const t = rawFrame - Math.floor(rawFrame);
          const currentFrame = SQUAT_FRAMES[frameIndex];
          const nextFrame = SQUAT_FRAMES[nextIndex];
          const interpolated = lerpJoints(currentFrame.joints, nextFrame.joints, t);
          drawFrame(canvas, interpolated, currentFrame.feedback);
          setCurrentFeedback(currentFrame.feedback);
          if (frameIndex === SQUAT_FRAMES.length - 1 && t < 0.05) {
            repCountRef.current += 1;
            const newRep = repCountRef.current;
            setRepCount(newRep);
            const summaryIndex = (newRep - 1) % REP_SUMMARIES.length;
            const summary = REP_SUMMARIES[summaryIndex];
            const mins = Math.floor(sessionSecondsRef.current / 60);
            const secs = sessionSecondsRef.current % 60;
            setFeedbackHistory(p => [
              { type: summary.type, message: summary.message, time: `${mins}:${secs.toString().padStart(2, "0")}` },
              ...p,
            ].slice(0, 12));
          }
          rafRef.current = requestAnimationFrame(animate);
        };
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(rafRef.current);
      }
      return next;
    });
  }, [drawFrame]);

  return (
    <section className="py-24 bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI Form Analysis — Live Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your AI spotter{" "}
            <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
              never blinks.
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time pose tracking catches form errors before they cause injury.
            Most apps count reps. YFIT coaches every single one.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left — canvas + feedback history */}
          <div className="space-y-4">
            {/* Canvas panel */}
            <div className="bg-gray-900/80 border border-green-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/10 bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-gray-500 font-mono">YFIT AI — Form Analysis</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">LIVE</span>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={400}
                height={420}
                className="w-full block"
              />

              {/* Stats bar */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-green-500/10 bg-gray-900/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{repCount}</div>
                  <div className="text-xs text-gray-500">Reps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: currentFeedback.color }}>
                    {currentFeedback.score}
                  </div>
                  <div className="text-xs text-gray-500">Form Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10</div>
                  <div className="text-xs text-gray-500">Exercises</div>
                </div>
                <button
                  onClick={handlePlayPause}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    borderColor: "rgba(34,197,94,0.3)",
                    color: isPlaying ? "#f59e0b" : "#22c55e",
                    background: "rgba(34,197,94,0.05)"
                  }}
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
              </div>
            </div>

            {/* Feedback history panel */}
            <div className="bg-gray-900/80 border border-green-500/20 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/10">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Rep Feedback</span>
                <button
                  onClick={() => setFeedbackHistory([{ type: "success", message: "Session started — Bodyweight Squat selected", time: "0:00" }])}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="h-40 overflow-y-auto px-4 py-3 space-y-2">
                {feedbackHistory.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xs text-gray-600 font-mono w-8 flex-shrink-0 pt-0.5">{entry.time}</span>
                    <div
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg"
                      style={{
                        background: entry.type === "success" ? "rgba(34,197,94,0.08)" : entry.type === "warning" ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                        color: entry.type === "success" ? "#86efac" : entry.type === "warning" ? "#fcd34d" : "#fca5a5",
                        border: `1px solid ${entry.type === "success" ? "rgba(34,197,94,0.2)" : entry.type === "warning" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}
                    >
                      {entry.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — feature list */}
          <div className="space-y-8 lg:pt-4">
            {[
              {
                icon: "🎯",
                title: "10 Exercises Supported",
                desc: "Squat, push-up, plank, sit-up, deadlift, bench press, lateral raise, preacher curl, bicep curl, and bent-over row — all analysed in real time using your device camera.",
                color: "#22c55e",
              },
              {
                icon: "⚡",
                title: "Real-Time Form Corrections",
                desc: "Feedback fires every frame — 'Go deeper', 'Keep chest up', 'Knees too far forward'. You correct the issue before the rep is even finished.",
                color: "#f59e0b",
              },
              {
                icon: "📋",
                title: "Per-Rep Feedback History",
                desc: "Every rep gets a summary — the worst issue or a 'Good squat!' if your form was clean. Scroll back through your session to see exactly where you improved.",
                color: "#a78bfa",
              },
              {
                icon: "🛡️",
                title: "Injury Prevention",
                desc: "Patterns that lead to injury — knee cave, forward lean, hip drop — are flagged before they become chronic problems. Your joints will thank you.",
                color: "#38bdf8",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: item.color + "15", border: `1px solid ${item.color}30` }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}

            {/* Exercise chips */}
            <div className="pt-2">
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">Supported exercises</p>
              <div className="flex flex-wrap gap-2">
                {["Squat", "Push-Up", "Plank", "Sit-Up", "Deadlift", "Bench Press", "Lateral Raise", "Preacher Curl", "Bicep Curl", "Bent-Over Row"].map(ex => (
                  <span key={ex} className="text-xs px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://app.yfitai.com"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-green-500/25"
              >
                Try Form Analysis Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-xs text-gray-600 mt-3">3 free sessions/month on the Free plan</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
