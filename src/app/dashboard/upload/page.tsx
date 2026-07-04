"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, FileUp, Sparkles, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UploadNotePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState("1");
  const [branch, setBranch] = useState("cs");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setErrorMsg("Only PDF files are supported!");
      setFile(null);
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMsg("File size must be less than 15MB!");
      setFile(null);
      return;
    }

    setErrorMsg("");
    setFile(selectedFile);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setIsUploaded(true);
      setTitle("");
      setDescription("");
      setFile(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Upload Study Material
        </h1>
        <p className="text-zinc-400 text-sm">
          Submit lecture notes, guidelines, or summaries. PDF files only, max 15MB.
        </p>
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-4 border-b border-zinc-800/40 flex-row items-center gap-3">
          <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-zinc-100 font-sans">Submit Document</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Provide document parameters and review details.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isUploaded ? (
            <div className="flex flex-col items-center justify-center text-center py-10 gap-4">
              <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-1">
                Upload Successful <Sparkles className="h-4 w-4 text-indigo-400" />
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
                Your study guide has been received and added to the review queue. Admins will verify readability and content before posting it public.
              </p>
              <Button 
                onClick={() => setIsUploaded(false)}
                variant="outline" 
                className="mt-4 border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 text-xs py-4 px-6 rounded-xl"
              >
                Upload Another Note
              </Button>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Note Title</label>
                <Input
                  required
                  placeholder="e.g. Linear Algebra Unit 1 Summary..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-zinc-200 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Note Description</label>
                <textarea
                  rows={3}
                  placeholder="Summarize the topics covered (e.g. matrices, vector spaces)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-200 text-sm rounded-xl p-3.5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none placeholder-zinc-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Department Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="bg-zinc-900/50 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
                  >
                    <option value="cs">Computer Science & Eng</option>
                    <option value="ee">Electrical Eng</option>
                    <option value="me">Mechanical Eng</option>
                    <option value="cv">Civil Eng</option>
                    <option value="basic">Basic Sciences</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="bg-zinc-900/50 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={String(sem)}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload Zone */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">File Attachment</label>
                <div className="border border-dashed border-zinc-800 hover:border-zinc-700/80 bg-zinc-900/20 rounded-2xl p-6.5 text-center flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileUp className="h-8 w-8 text-zinc-500" />
                  <div>
                    <p className="text-xs font-bold text-zinc-200">
                      {file ? file.name : "Select study note PDF"}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Drag and drop or browse files"}
                    </p>
                  </div>
                </div>
                {errorMsg && (
                  <p className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-1">
                    <FileWarning className="h-3.5 w-3.5" /> {errorMsg}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isUploading || !title || !file}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 rounded-xl text-xs py-5.5 shadow-lg shadow-indigo-500/10 mt-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>Uploading PDF...</>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" /> Submit for Verification
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
