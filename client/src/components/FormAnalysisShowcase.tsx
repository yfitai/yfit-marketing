import { useEffect, useRef, useState } from "react";

// Skeleton joint positions for a squat exercise (normalized 0-1 coordinates)
// Each frame represents a point in the squat motion cycle
const SQUAT_FRAMES = [
  // Standing upright
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
    feedback: { text: "Good starting position", color: "#10b981", score: 98 },
  },
  // Beginning descent
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
    feedback: { text: "Keep chest up", color: "#f59e0b", score: 85 },
  },
  // Mid squat
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
    feedback: { text: "Knees tracking over toes ✓", color: "#10b981", score: 92 },
  },
  // Deep squat
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
    feedback: { text: "Depth reached — parallel ✓", color: "#10b981", score: 96 },
  },
  // Rising
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
    feedback: { text: "Drive through heels ✓", color: "#10b981", score: 94 },
  },
  // Back to standing
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
    feedback: { text: "Rep complete — great form!", color: "#10b981", score: 98 },
  },
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

export default function FormAnalysisShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [currentFeedback, setCurrentFeedback] = useState(SQUAT_FRAMES[0].feedback);
  const [repCount, setRepCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const FRAME_DURATION = 600; // ms per frame
    const TOTAL_DURATION = SQUAT_FRAMES.length * FRAME_DURATION;

    let lastTime = performance.now();
    let paused = false;

    function draw(joints: Record<string, number[]>, feedback: typeof SQUAT_FRAMES[0]["feedback"]) {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.strokeStyle = "rgba(59,130,246,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Floor line
      ctx.strokeStyle = "rgba(59,130,246,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.1, H * 0.92);
      ctx.lineTo(W * 0.9, H * 0.92);
      ctx.stroke();

      // Score arc
      const score = feedback.score;
      const scoreColor = score >= 90 ? "#10b981" : score >= 75 ? "#f59e0b" : "#ef4444";
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
      ctx.font = "bold 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`${score}`, W * 0.85, H * 0.18 + 5);

      // Draw bones
      for (const [a, b] of BONES) {
        const jA = joints[a];
        const jB = joints[b];
        if (!jA || !jB) continue;
        const x1 = jA[0] * W;
        const y1 = jA[1] * H;
        const x2 = jB[0] * W;
        const y2 = jB[1] * H;

        // Glow effect
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "rgba(99,179,237,0.6)";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Core line
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#93c5fd";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw joints
      for (const [key, pos] of Object.entries(joints)) {
        const x = pos[0] * W;
        const y = pos[1] * H;
        const isKnee = key.includes("Knee");
        const isHip = key.includes("Hip");
        const radius = isKnee || isHip ? 7 : key === "head" ? 10 : 5;
        const color = isKnee ? "#f59e0b" : isHip ? "#a78bfa" : "#60a5fa";

        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Feedback pill
      const pillColor = feedback.color;
      ctx.fillStyle = pillColor + "22";
      ctx.strokeStyle = pillColor;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      const pillW = 200;
      const pillH = 32;
      const pillX = (W - pillW) / 2;
      const pillY = H * 0.04;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 16);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pillColor;
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(feedback.text, W / 2, pillY + 21);
    }

    function animate(now: number) {
      if (paused) return;
      const delta = now - lastTime;
      lastTime = now;
      timeRef.current = (timeRef.current + delta) % TOTAL_DURATION;

      const rawFrame = timeRef.current / FRAME_DURATION;
      const frameIndex = Math.floor(rawFrame) % SQUAT_FRAMES.length;
      const nextIndex = (frameIndex + 1) % SQUAT_FRAMES.length;
      const t = rawFrame - Math.floor(rawFrame);

      const currentFrame = SQUAT_FRAMES[frameIndex];
      const nextFrame = SQUAT_FRAMES[nextIndex];
      const interpolated = lerpJoints(currentFrame.joints, nextFrame.joints, t);

      draw(interpolated, currentFrame.feedback);
      setCurrentFeedback(currentFrame.feedback);

      // Count reps (when we complete a full cycle)
      if (frameIndex === SQUAT_FRAMES.length - 1 && t < 0.05) {
        setRepCount(r => r + 1);
      }

      animRef.current = requestAnimationFrame(animate);
    }

    if (isPlaying) {
      animRef.current = requestAnimationFrame(animate);
    }

    return () => {
      paused = true;
      cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  return (
    <section className="py-24 bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            AI Form Analysis — Live Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your AI spotter{" "}
            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              never blinks.
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time joint tracking catches form errors before they cause injury.
            Most apps count reps. YFIT coaches every single one.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Canvas demo */}
          <div className="relative">
            <div className="bg-gray-900/80 border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/10 bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-gray-500 font-mono">yfit_form_analysis.live</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">LIVE</span>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={400}
                height={480}
                className="w-full"
                style={{ background: "transparent" }}
              />

              {/* Stats bar */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-blue-500/10 bg-gray-900/50">
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
                  <div className="text-2xl font-bold text-white">14</div>
                  <div className="text-xs text-gray-500">Joints Tracked</div>
                </div>
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    borderColor: "rgba(59,130,246,0.3)",
                    color: isPlaying ? "#f59e0b" : "#10b981",
                    background: "rgba(59,130,246,0.05)"
                  }}
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
              </div>
            </div>

            {/* Floating feedback card */}
            <div
              className="absolute -right-4 top-1/3 bg-gray-900 border rounded-xl px-4 py-3 shadow-xl hidden lg:block"
              style={{ borderColor: currentFeedback.color + "44" }}
            >
              <div className="text-xs text-gray-500 mb-1">AI Feedback</div>
              <div className="text-sm font-semibold" style={{ color: currentFeedback.color }}>
                {currentFeedback.text}
              </div>
            </div>
          </div>

          {/* Feature list */}
          <div className="space-y-8">
            {[
              {
                icon: "🦴",
                title: "14-Point Joint Tracking",
                desc: "Every major joint tracked in real time — shoulders, elbows, hips, knees, and ankles. The AI knows your body better than a mirror.",
                color: "#60a5fa",
              },
              {
                icon: "🎯",
                title: "Instant Form Corrections",
                desc: "Audio and visual cues fire within milliseconds of a form break. No more finishing a set with bad technique and wondering why your knees hurt.",
                color: "#f59e0b",
              },
              {
                icon: "📊",
                title: "Per-Rep Form Reports",
                desc: "After every set, get a breakdown of your best and worst reps with specific joint angle data. Track your form improvement over weeks.",
                color: "#a78bfa",
              },
              {
                icon: "🛡️",
                title: "Injury Prevention Insights",
                desc: "Patterns that lead to injury — like knee cave or forward lean — are flagged before they become chronic problems.",
                color: "#10b981",
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

            <div className="pt-4">
              <a
                href="https://app.yfitai.com"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25"
              >
                Try Form Analysis Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-xs text-gray-600 mt-3">3 free sessions/month on the Starter plan</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
