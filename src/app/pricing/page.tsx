import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getUserAIUsage } from "@/app/actions/ai-usage";
import {
  Crown,
  Sparkles,
  Check,
  X,
  Zap,
  Eye,
  Timer,
  GraduationCap,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing — Choose Your Study Plan | College Notes",
  description:
    "Start free with 10 AI study generations per month, or upgrade to Premium for 100 generations, scanned PDF support, and upcoming exam-focused workflows.",
};

const FREE_FEATURES = [
  "10 AI generations / month",
  "Smart Summary",
  "Practice Quiz",
  "Flashcards",
  "Important Questions",
  "Ask Doubt",
  "Saved Study Library",
  "Basic PDF note support",
];

const PREMIUM_FEATURES = [
  "100 AI generations / month",
  "Extended scanned / handwritten PDF usage",
  "Premium Member badge",
  "Premium Study Copilot workspace",
  "Saved Study Library",
  "Upcoming: Exam Sprint Mode",
  "Upcoming: Multi-PDF Study Pack",
  "Upcoming: Memory Booster",
  "Upcoming: Final Revision Sheet",
];

const COMPARISON_ROWS: { feature: string; free: boolean | string; premium: boolean | string }[] = [
  { feature: "AI generations / month", free: "10", premium: "100" },
  { feature: "Smart Summary", free: true, premium: true },
  { feature: "Practice Quiz", free: true, premium: true },
  { feature: "Flashcards", free: true, premium: true },
  { feature: "Important Questions", free: true, premium: true },
  { feature: "Ask Doubt", free: true, premium: true },
  { feature: "Saved Study Library", free: true, premium: true },
  { feature: "Scanned PDF support", free: "Basic", premium: "Extended" },
  { feature: "Premium badge", free: false, premium: true },
  { feature: "Exam Sprint Mode", free: false, premium: "Coming Soon" },
  { feature: "Multi-PDF Study Pack", free: false, premium: "Coming Soon" },
  { feature: "Memory Booster", free: false, premium: "Coming Soon" },
];

const WHY_UPGRADE = [
  {
    icon: "zap",
    title: "More AI room",
    desc: "Generate more summaries, quizzes, flashcards, doubts, and exam questions without hitting a wall.",
  },
  {
    icon: "eye",
    title: "Better scanned note support",
    desc: "Use AI with scanned and handwritten PDFs more comfortably with extended extraction.",
  },
  {
    icon: "timer",
    title: "Exam-focused workflows",
    desc: "Upcoming premium workflows will help you revise faster and smarter before exams.",
  },
  {
    icon: "crown",
    title: "Premium study identity",
    desc: "Get a Premium Member badge and upgraded Study Copilot workspace built for serious students.",
  },
];

const FAQS = [
  {
    q: "Can I use Study Copilot for free?",
    a: "Yes. Free users get 10 AI generations per month, covering Smart Summary, Practice Quiz, Flashcards, Important Questions, and Ask Doubt.",
  },
  {
    q: "What counts as an AI generation?",
    a: "Generating a summary, quiz, flashcards, important questions, or submitting a doubt each count as one generation.",
  },
  {
    q: "Do saved results count again?",
    a: "No. Opening, reading, copying, deleting, searching, or filtering your saved results does not use any AI generations.",
  },
  {
    q: "Is scanned PDF support available?",
    a: "Basic scanned PDF support is available to all users. Extended and more reliable scanned/handwritten PDF usage is planned for Premium.",
  },
  {
    q: "Is payment available now?",
    a: "Online payment is coming soon. Premium access is being finalized. Contact the admin to request early access.",
  },
];

function IconFor({ name }: { name: string }) {
  if (name === "zap") return <Zap className="h-5 w-5 text-indigo-400" />;
  if (name === "eye") return <Eye className="h-5 w-5 text-indigo-400" />;
  if (name === "timer") return <Timer className="h-5 w-5 text-indigo-400" />;
  return <Crown className="h-5 w-5 text-indigo-400" />;
}

export default async function PricingPage() {
  const { userId } = await auth();
  let plan: "free" | "premium" | null = null;
  let usedThisMonth = 0;
  let monthlyLimit = 10;

  if (userId) {
    const usageResult = await getUserAIUsage();
    if (usageResult.success && usageResult.data) {
      plan = usageResult.data.plan;
      usedThisMonth = usageResult.data.usedThisMonth;
      monthlyLimit = usageResult.data.monthlyLimit;
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col font-sans">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-80px] left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute top-[10%] right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-[160px]" />
        <div className="absolute bottom-[20%] left-1/3 w-[350px] h-[350px] rounded-full bg-amber-600/5 blur-[130px]" />
      </div>

      <Header />

      <main className="flex-grow z-10 pt-24 pb-20 px-4 sm:px-6 max-w-6xl mx-auto w-full flex flex-col gap-20">

        {/* HERO */}
        <div className="flex flex-col items-center text-center gap-5 pt-6">
          {plan === "premium" && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Premium Member</span>
            </div>
          )}
          {plan === "free" && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Free Plan Active</span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
              Study Plan
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
            Start free, upgrade when you need more AI-powered study help.
          </p>
        </div>

        {/* PLAN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">

          {/* Free */}
          <div className="flex flex-col gap-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-7 sm:p-8 relative">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Free</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-5xl font-black text-zinc-100">₹0</span>
                <span className="text-sm text-zinc-500">/month</span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">For trying Study Copilot.</p>
            </div>

            {plan === "free" && userId && (
              <div className="flex flex-col gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-400">AI Usage this month</span>
                  <span className="font-bold text-zinc-200">{usedThisMonth} / {monthlyLimit}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usedThisMonth / monthlyLimit) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <ul className="flex flex-col gap-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-4">
              {plan === "premium" ? (
                <div className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-sm text-center cursor-default">
                  Included
                </div>
              ) : plan === "free" ? (
                <div className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-sm text-center cursor-default">
                  ✓ Current Plan
                </div>
              ) : (
                <Link href="/sign-up" className="block w-full">
                  <button className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm transition-colors border border-zinc-700">
                    Start Free
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Premium */}
          <div className="flex flex-col gap-6 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-md border border-amber-500/25 rounded-3xl p-7 sm:p-8 relative shadow-[0_0_60px_rgba(245,158,11,0.07)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

            <div className="absolute top-6 right-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-300 text-zinc-950 shadow">
                <Crown className="h-3 w-3" /> Most Popular
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Premium</span>
              <div className="mt-1">
                <span className="text-3xl font-black text-zinc-100">Coming Soon</span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">For serious exam preparation.</p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-200">
                  <Check className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-4 flex flex-col gap-3">
              <button
                disabled
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500/30 text-amber-300/80 font-bold text-sm cursor-not-allowed"
              >
                Upgrade Coming Soon
              </button>
              <Link href="/dashboard/contact" className="block w-full">
                <button className="w-full py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 font-semibold text-xs transition-colors">
                  Contact Admin / Request Access
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Plan Comparison</h2>
            <p className="text-sm text-zinc-500">Everything side by side.</p>
          </div>

          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md overflow-hidden">
            <div className="grid grid-cols-3 border-b border-zinc-800/60 bg-zinc-900/60">
              <div className="px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Feature</div>
              <div className="px-5 py-3.5 text-xs font-bold text-zinc-300 uppercase tracking-wider text-center border-l border-zinc-800/60">Free</div>
              <div className="px-5 py-3.5 text-xs font-bold text-amber-400 uppercase tracking-wider text-center border-l border-zinc-800/60">
                <span className="flex items-center justify-center gap-1.5"><Crown className="h-3.5 w-3.5" />Premium</span>
              </div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-3 border-b border-zinc-800/40 last:border-b-0 ${i % 2 !== 0 ? "bg-zinc-900/20" : ""}`}>
                <div className="px-5 py-3 text-sm text-zinc-300 font-medium">{row.feature}</div>
                <div className="px-5 py-3 text-center border-l border-zinc-800/40">
                  {typeof row.free === "boolean"
                    ? row.free ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-zinc-600 mx-auto" />
                    : <span className="text-xs font-semibold text-zinc-300">{row.free}</span>}
                </div>
                <div className="px-5 py-3 text-center border-l border-zinc-800/40">
                  {typeof row.premium === "boolean"
                    ? row.premium ? <Check className="h-4 w-4 text-amber-400 mx-auto" /> : <X className="h-4 w-4 text-zinc-600 mx-auto" />
                    : <span className={`text-xs font-semibold ${row.premium === "Coming Soon" ? "text-amber-400/60 italic" : "text-amber-300"}`}>{row.premium}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WHY PREMIUM */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Why students upgrade</h2>
            <p className="text-sm text-zinc-500">Study smarter with more AI power.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHY_UPGRADE.map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 hover:border-zinc-700/60 hover:bg-zinc-900/60 transition-all">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 w-fit">
                  <IconFor name={icon} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-sm mb-1">{title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-700/60 transition-colors">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none">
                  <span className="text-sm font-semibold text-zinc-200">{q}</span>
                  <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 pt-1">
                  <p className="text-sm text-zinc-400 leading-relaxed">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="flex flex-col items-center gap-6 text-center bg-zinc-900/30 border border-zinc-800/60 rounded-3xl py-14 px-6 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-600/6 blur-2xl rounded-full" />
          </div>
          <GraduationCap className="h-8 w-8 text-indigo-400 z-10" />
          <div className="z-10 flex flex-col gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-zinc-100">Ready to study smarter?</h3>
            <p className="text-sm text-zinc-400 max-w-sm">
              Start with Study Copilot for free. Upgrade when you need more AI study power.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 z-10">
            <Link href="/dashboard/study-copilot" className="block">
              <button className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-500/15 flex items-center gap-2">
                Open Study Copilot <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/dashboard/contact" className="block">
              <button className="px-6 py-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 font-semibold text-sm transition-colors">
                Request Premium Access
              </button>
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
