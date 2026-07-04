import Link from "next/link";
import { 
  ArrowRight, 
  Search, 
  UploadCloud, 
  ShieldCheck, 
  BookOpen, 
  Flame, 
  Clock, 
  Layout, 
  Sparkles, 
  Compass, 
  Bookmark, 
  ArrowDownToLine, 
  MessageSquareDiff,
  MessageCircleQuestion
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] pointer-events-none opacity-20 z-0">
        <div className="absolute top-[5%] left-[10%] w-[550px] h-[550px] rounded-full bg-indigo-600 blur-[130px] animate-pulse duration-[8000ms]" />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-violet-600 blur-[140px] animate-pulse duration-[10000ms]" />
      </div>

      {/* Professional Sticky Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-7xl mx-auto w-full text-center flex flex-col items-center">
        {/* Banner Badge */}
        <div className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in shadow-inner shadow-indigo-500/5 hover:border-indigo-500/40 transition-all duration-300">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Next-Generation Document Sharing Platform</span>
        </div>

        {/* Animated Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.08] mb-6 select-none">
          Unlock Academic{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
            Excellence
          </span>
          , Shared.
        </h1>

        {/* Hero Subtitle */}
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-10">
          The ultimate hub for structured lecture notes, exam guidelines, and research papers. Verified by peers, curated for speed, and encrypted for security.
        </p>

        {/* Premium Floating Search Input */}
        <div className="w-full max-w-2xl bg-zinc-900/45 border border-zinc-800/80 rounded-2xl p-2 mb-16 shadow-2xl backdrop-blur-md flex items-center focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-300">
          <div className="pl-4 pr-2 text-zinc-500">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search by course code, department, or topic (e.g., CS101, Linear Algebra)..."
            className="w-full bg-transparent border-0 outline-none text-zinc-200 placeholder-zinc-500 text-sm md:text-base py-3 px-2 focus:ring-0 focus:outline-none"
          />
          <Link href="/dashboard/browse">
            <Button className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-medium px-5 md:px-7 py-3 rounded-xl transition-all duration-200 shrink-0 text-sm h-auto shadow-md shadow-indigo-500/20">
              Browse
            </Button>
          </Link>
        </div>

        {/* Live Dashboard Mockup Display */}
        <div className="relative w-full max-w-5xl mx-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-3.5 backdrop-blur-lg shadow-[0_0_50px_rgba(99,102,241,0.08)] mb-28 group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500/5 via-violet-500/0 to-pink-500/5 opacity-50 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
          {/* Simulated Browser Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-4 px-2">
            <div className="flex gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-zinc-800" />
              <span className="h-3.5 w-3.5 rounded-full bg-zinc-800" />
              <span className="h-3.5 w-3.5 rounded-full bg-zinc-800" />
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800/50 px-5.5 py-1 rounded-lg text-[11px] text-zinc-500 font-medium tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              collegenotes.com/dashboard
            </div>
            <div className="w-12" />
          </div>
          {/* Simulated App Screenshot Grid */}
          <div className="grid grid-cols-4 gap-4 p-2 text-left text-zinc-400">
            {/* Sidebar Mock */}
            <div className="col-span-1 border-r border-zinc-800/60 pr-4 flex flex-col gap-4 text-xs font-semibold">
              <div className="h-7 bg-zinc-800/40 rounded-lg w-3/4 mb-4" />
              <div className="flex items-center gap-2 p-2 bg-indigo-500/10 text-indigo-300 rounded-lg"><Compass className="h-4 w-4" /> Discover</div>
              <div className="flex items-center gap-2 p-2 text-zinc-500 hover:text-zinc-300"><UploadCloud className="h-4 w-4" /> Upload Note</div>
              <div className="flex items-center gap-2 p-2 text-zinc-500 hover:text-zinc-300"><Bookmark className="h-4 w-4" /> My Favorites</div>
              <div className="flex items-center gap-2 p-2 text-zinc-500 hover:text-zinc-300"><Clock className="h-4 w-4" /> History</div>
            </div>
            {/* Main Panel Mock */}
            <div className="col-span-3 pl-2 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <div className="h-7 bg-zinc-800/40 rounded-lg w-1/3" />
                <div className="h-7 bg-zinc-800/40 rounded-lg w-1/5" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-950/60 border border-zinc-800/50 p-4 rounded-xl flex flex-col gap-2 shadow-inner">
                  <div className="h-4.5 bg-indigo-500/20 text-indigo-400 w-fit px-2 py-0.5 rounded text-[10px] font-bold">PDF</div>
                  <div className="font-bold text-sm text-zinc-100 mt-2">Data Structures 101</div>
                  <div className="text-[11px] text-zinc-500 font-medium">CSE &bull; Sem 3</div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-4 border-t border-zinc-800/60 pt-2.5">
                    <span>1,240 downloads</span>
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800/50 p-4 rounded-xl flex flex-col gap-2 shadow-inner">
                  <div className="h-4.5 bg-violet-500/20 text-violet-400 w-fit px-2 py-0.5 rounded text-[10px] font-bold">PDF</div>
                  <div className="font-bold text-sm text-zinc-100 mt-2">Linear Algebra Notes</div>
                  <div className="text-[11px] text-zinc-500 font-medium">MATH &bull; Sem 2</div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-4 border-t border-zinc-800/60 pt-2.5">
                    <span>890 downloads</span>
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800/50 p-4 rounded-xl flex flex-col gap-2 shadow-inner">
                  <div className="h-4.5 bg-emerald-500/20 text-emerald-400 w-fit px-2 py-0.5 rounded text-[10px] font-bold">DOCX</div>
                  <div className="font-bold text-sm text-zinc-100 mt-2">OS Lecture Guides</div>
                  <div className="text-[11px] text-zinc-500 font-medium">CSE &bull; Sem 4</div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-4 border-t border-zinc-800/60 pt-2.5">
                    <span>452 downloads</span>
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 w-full mb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-50 mb-4 select-none">
            Tailored For Fast Learning
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Every feature is fine-tuned to deliver a rapid, securely structured, and beautiful resource-sharing experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="relative group overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 rounded-3xl p-8 text-left transition-all duration-300 backdrop-blur-sm shadow-xl">
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-2xl w-fit mb-6 shadow-inner">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-50 mb-3 group-hover:text-indigo-300 transition-colors">Drag & Drop Upload</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Upload your documents instantly with a fluid drag-and-drop panel. Tracks progress indicators and validation failures in real-time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="relative group overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 rounded-3xl p-8 text-left transition-all duration-300 backdrop-blur-sm shadow-xl">
            <div className="bg-violet-500/10 text-violet-400 p-3 rounded-2xl w-fit mb-6 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-50 mb-3 group-hover:text-violet-300 transition-colors">Admin Verification Queue</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Ensure academic integrity. Admins evaluate uploaded resources, course alignments, and formatting before files are pushed live.
            </p>
          </div>

          {/* Card 3 */}
          <div className="relative group overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 rounded-3xl p-8 text-left transition-all duration-300 backdrop-blur-sm shadow-xl">
            <div className="bg-pink-500/10 text-pink-400 p-3 rounded-2xl w-fit mb-6 shadow-inner">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-50 mb-3 group-hover:text-pink-300 transition-colors">Clean PDF Sandbox</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Read lecture notes and study guides in-app using our responsive, feature-rich PDF reader, eliminating external downloads.
            </p>
          </div>

          {/* Card 4 */}
          <div className="relative group overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 rounded-3xl p-8 text-left transition-all duration-300 backdrop-blur-sm shadow-xl">
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl w-fit mb-6 shadow-inner">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-50 mb-3 group-hover:text-emerald-300 transition-colors">Fast Filter Controls</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Filter by engineering branch, specific semester, or target subjects. Find exactly what you need in under three clicks.
            </p>
          </div>

          {/* Card 5 */}
          <div className="relative group overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 rounded-3xl p-8 text-left transition-all duration-300 backdrop-blur-sm shadow-xl">
            <div className="bg-cyan-500/10 text-cyan-400 p-3 rounded-2xl w-fit mb-6 shadow-inner">
              <Layout className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-50 mb-3 group-hover:text-cyan-300 transition-colors">Unified Dashboard</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Keep bookmarks, recent history, downloads count, and note creation states in a single, high-fidelity responsive workspace.
            </p>
          </div>

          {/* Card 6 */}
          <div className="relative group overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 rounded-3xl p-8 text-left transition-all duration-300 backdrop-blur-sm shadow-xl">
            <div className="bg-amber-500/10 text-amber-400 p-3 rounded-2xl w-fit mb-6 shadow-inner">
              <MessageSquareDiff className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-50 mb-3 group-hover:text-amber-300 transition-colors">Secure Clerk Identity</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Leverage Clerk's secure third-party auth, which synchronizes profile details to Supabase using signatures verified via Svix.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 w-full mb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-50 mb-4 select-none">
            How It Works
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Collaborating and sharing resources takes less than two minutes.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto grid md:grid-cols-3 gap-12 text-center md:text-left">
          {/* Step 1 */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="text-xl font-bold text-zinc-100">Upload & Categorize</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Log in with Clerk, drag your files into the drag-drop uploader, specify branch, subject code, and semester.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="text-xl font-bold text-zinc-100">Admin Review Queue</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Our admin team evaluates note legibility, subject mapping accuracy, and compliance before authorization.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="text-xl font-bold text-zinc-100">Browse & Download</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Approved documents become searchable in public grids. View notes in-app or download them instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 w-full mb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-50 mb-4 select-none">
            Loved By Students
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Here is what engineering students have to say about the College Notes experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-zinc-900/30 border border-zinc-800/60 p-6 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
            <p className="text-sm text-zinc-300 leading-relaxed italic mb-6">
              "Finding quality notes for subjects like OS and DBMS was a hassle. With College Notes, I found verified notes that literally saved my GPA."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                JD
              </div>
              <div>
                <h5 className="text-sm font-bold text-zinc-100">Jane Doe</h5>
                <span className="text-[11px] text-zinc-500">Computer Engineering, Y3</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/60 p-6 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
            <p className="text-sm text-zinc-300 leading-relaxed italic mb-6">
              "The document reader is amazing. I can preview study guides on my phone during my transit without having to download massive files."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                AS
              </div>
              <div>
                <h5 className="text-sm font-bold text-zinc-100">Alex Smith</h5>
                <span className="text-[11px] text-zinc-500">Electronics Engineering, Y2</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/60 p-6 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
            <p className="text-sm text-zinc-300 leading-relaxed italic mb-6">
              "Uploading notes is incredibly simple. Being able to see how many people downloaded my guides actually keeps me motivated to write cleaner summaries!"
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                RK
              </div>
              <div>
                <h5 className="text-sm font-bold text-zinc-100">Raj Kumar</h5>
                <span className="text-[11px] text-zinc-500">Information Technology, Y4</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 w-full mb-32">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1 text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2">
            <MessageCircleQuestion className="h-4 w-4" /> Got Questions?
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-50 select-none">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-6.5 backdrop-blur-sm shadow-xl">
          <Accordion className="w-full">
            <AccordionItem value="faq-1" className="border-zinc-800/60">
              <AccordionTrigger className="text-sm font-semibold text-zinc-200 hover:text-zinc-50 hover:no-underline">
                What file types and sizes are supported?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400 text-xs leading-relaxed">
                Currently, we support PDF document uploads. The maximum allowed file size is 50MB per document to ensure high performance and compliance.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2" className="border-zinc-800/60">
              <AccordionTrigger className="text-sm font-semibold text-zinc-200 hover:text-zinc-50 hover:no-underline">
                How does the admin verification process work?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400 text-xs leading-relaxed">
                Once you upload a document, it enters a verification queue. Administrators evaluate file legibility, confirm details (semester, branch, subject), and check for copyright issues before approving it.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3" className="border-zinc-800/60">
              <AccordionTrigger className="text-sm font-semibold text-zinc-200 hover:text-zinc-50 hover:no-underline">
                Are my uploads secure?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400 text-xs leading-relaxed">
                Yes. Files are stored securely in Supabase Storage with strict Row Level Security (RLS) policies. Only approved documents can be public, while unapproved files are restricted solely to the uploader and administrators.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-4" className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold text-zinc-200 hover:text-zinc-50 hover:no-underline">
                Can I edit or delete my notes after uploading?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400 text-xs leading-relaxed">
                You can edit the title, description, or metadata of your notes as long as the status is "pending" or "rejected". Once approved and published, only administrators can modify or remove the document.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 w-full mb-32">
        <div className="relative overflow-hidden bg-gradient-to-tr from-indigo-900/30 to-violet-900/10 border border-indigo-500/20 rounded-3xl p-12 text-center flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(99,102,241,0.05)]">
          <div className="absolute inset-0 bg-zinc-950/20 pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-50 relative z-10 select-none">
            Ready to Accelerate Your Learning?
          </h2>
          <p className="text-zinc-400 max-w-lg leading-relaxed relative z-10">
            Sign up with Clerk in seconds. Browse verified exam summaries, share your own, and level up your grades today.
          </p>
          <div className="flex gap-4 mt-2 relative z-10">
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-medium shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 px-8 py-6 h-auto rounded-xl">
                Get Started Now
              </Button>
            </Link>
            <Link href="/dashboard/browse">
              <Button size="lg" variant="outline" className="border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/40 px-8 py-6 h-auto rounded-xl">
                Browse Library
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <Footer />
    </div>
  );
}
