"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  FileUp, 
  Sparkles, 
  FileWarning, 
  Loader2,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import { uploadNoteAction } from "@/app/actions/notes";
import { useSupabase } from "@/hooks/useSupabase";

export default function UploadNotePage() {
  const supabase = useSupabase();
  const router = useRouter();
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("1");
  const [subjectId, setSubjectId] = useState("");
  const [college, setCollege] = useState("");
  const [professor, setProfessor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Data State
  const [branches, setBranches] = useState<{id: string, name: string, code: string}[]>([]);
  const [subjects, setSubjects] = useState<{id: string, name: string, code: string}[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Branches on Mount
  useEffect(() => {
    async function loadBranches() {
      try {
        setIsLoadingMetadata(true);
        const { data, error } = await supabase
          .from("branches")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          console.error("[Client Operations Failure - loadBranches]:", error);
          setErrorMsg("Failed to load branches: " + error.message);
          return;
        }

        if (data) {
          setBranches(data);
          if (data.length > 0) {
            setBranchId(data[0].id);
          }
        }
      } catch (err: any) {
        console.error("Unexpected error loading branches:", err);
        setErrorMsg("Failed to load branches due to an unexpected error.");
      } finally {
        setIsLoadingMetadata(false);
      }
    }
    loadBranches();
  }, [supabase]);

  // Fetch Subjects when Branch or Semester changes
  useEffect(() => {
    async function loadSubjects() {
      if (!branchId || !semester) {
        setSubjects([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .eq("branch_id", branchId)
          .eq("semester", parseInt(semester, 10))
          .order("name", { ascending: true });

        if (error) {
          console.error("[Client Operations Failure - loadSubjects]:", error);
          setErrorMsg("Failed to load subjects: " + error.message);
          return;
        }

        if (data) {
          setSubjects(data);
          if (data.length > 0) {
            setSubjectId(data[0].id);
          } else {
            setSubjectId("");
          }
        }
      } catch (err: any) {
        console.error("Unexpected error loading subjects:", err);
        setErrorMsg("Failed to load subjects due to an unexpected error.");
      }
    }
    loadSubjects();
  }, [supabase, branchId, semester]);

  const validateFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setErrorMsg("Only PDF files are supported!");
      return false;
    }
    if (selectedFile.size === 0) {
      setErrorMsg("File cannot be empty!");
      return false;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMsg("File size must be less than 20MB!");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    } else {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selectedFile = e.dataTransfer.files?.[0];
    if (!selectedFile) return;
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file || !branchId || !subjectId) {
      setErrorMsg("Please fill all required fields and attach a PDF.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("branchId", branchId);
      formData.append("semester", semester);
      formData.append("subjectId", subjectId);
      formData.append("college", college);
      formData.append("professor", professor);
      formData.append("file", file);

      // Simulate a fake progress bar for UX since Next.js Server Actions 
      // don't natively stream upload progress bytes yet.
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 500);

      const res = await uploadNoteAction(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res?.success) {
        // Redirect to My Uploads page after a short delay for the progress bar to show 100%
        setTimeout(() => {
          router.push("/dashboard/my-uploads");
        }, 800);
      } else {
        throw new Error((res as any)?.error?.message || "Upload failed");
      }
    } catch (error: any) {
      setUploadProgress(0);
      setIsUploading(false);
      setErrorMsg(error.message || "An unexpected error occurred during upload.");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
          Upload Study Material
          <Sparkles className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-zinc-400 text-sm">
          Share your knowledge with the community. Please ensure your PDF is high quality and readable. Max size: 20MB.
        </p>
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-md shadow-2xl overflow-hidden relative">
        {/* Animated Progress Bar */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 4 }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-0 left-0 right-0 bg-zinc-800"
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <CardHeader className="pb-4 border-b border-zinc-800/40 flex-row items-center gap-3">
          <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-zinc-100 font-sans">Submit Document</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Provide accurate metadata to help others find your notes.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-6">
            
            {/* Title & Description */}
            <div className="flex flex-col gap-4 bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Note Title *</label>
                <Input
                  required
                  placeholder="e.g. Linear Algebra Unit 1 Summary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  className="bg-zinc-900/80 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-zinc-200 rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summarize the topics covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  className="bg-zinc-900/80 border-zinc-800 text-zinc-200 text-sm rounded-xl p-3.5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none placeholder-zinc-500 resize-none"
                />
              </div>
            </div>

            {/* Academic Metadata */}
            <div className="grid sm:grid-cols-2 gap-4 bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Branch *</label>
                <select
                  required
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={isUploading || isLoadingMetadata}
                  className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer disabled:opacity-50"
                >
                  {isLoadingMetadata ? (
                    <option value="">Loading branches...</option>
                  ) : branches.length === 0 ? (
                    <option value="">No branches found</option>
                  ) : (
                    branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Semester *</label>
                <select
                  required
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  disabled={isUploading}
                  className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={String(sem)}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subject *</label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={isUploading || isLoadingMetadata || !branchId}
                  className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer disabled:opacity-50"
                >
                  {!branchId ? (
                    <option value="">Select a branch first</option>
                  ) : subjects.length === 0 ? (
                    <option value="">No subjects available</option>
                  ) : (
                    subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid sm:grid-cols-2 gap-4 bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">College (Optional)</label>
                <Input
                  placeholder="e.g. MIT, Stanford"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  disabled={isUploading}
                  className="bg-zinc-900/80 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-zinc-200 rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Professor (Optional)</label>
                <Input
                  placeholder="e.g. Dr. Alan Turing"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  disabled={isUploading}
                  className="bg-zinc-900/80 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-zinc-200 rounded-xl"
                />
              </div>
            </div>

            {/* File Upload Zone */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">File Attachment *</label>
              
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-4 transition-all cursor-pointer relative
                      ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 bg-zinc-950/50'}
                      ${isUploading ? 'pointer-events-none opacity-50' : ''}
                    `}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      ref={fileInputRef}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-900 text-zinc-500'}`}>
                      <FileUp className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-200">
                        Drag and drop your PDF here
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        or click to browse files (Max 20MB)
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-700/50 rounded-2xl relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 z-10">
                      <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-red-400">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col max-w-[200px] sm:max-w-xs md:max-w-sm">
                        <span className="text-sm font-bold text-zinc-200 truncate">{file.name}</span>
                        <span className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</span>
                      </div>
                    </div>
                    {!isUploading && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={clearFile}
                        className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full z-10"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-400 font-bold flex items-center gap-1.5 mt-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20"
                  >
                    <FileWarning className="h-4 w-4 shrink-0" /> 
                    <span>{errorMsg}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isUploading || !title || !file || !branchId || !subjectId}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 rounded-xl text-sm py-6 shadow-xl shadow-indigo-500/10 mt-4 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> 
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5" /> Submit Note for Verification
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
