"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle2, LifeBuoy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactSupportPage() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setSubject("");
      setMessage("");
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Contact Support
        </h1>
        <p className="text-zinc-400 text-sm">
          Submit a ticket and our student help desk will get back to you within 24 hours.
        </p>
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-4 border-b border-zinc-800/40 flex-row items-center gap-3">
          <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-zinc-100 font-sans">New Support Ticket</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Provide details about your query.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center text-center py-10 gap-4">
              <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-zinc-100">Ticket Submitted Successfully</h3>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
                Your support request has been logged. We have sent an acknowledgment email. You can check the status on this page or your email inbox.
              </p>
              <Button 
                onClick={() => setIsSubmitted(false)}
                variant="outline" 
                className="mt-4 border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 text-xs py-4 px-6 rounded-xl"
              >
                Submit Another Ticket
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-zinc-900/50 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
                >
                  <option value="general">General Inquiry</option>
                  <option value="account">Account & Sign In</option>
                  <option value="uploads">Uploads & PDF Reviews</option>
                  <option value="downloads">Downloads & Subscriptions</option>
                  <option value="technical">Technical Bugs & Crashes</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subject</label>
                <Input
                  required
                  placeholder="Summarize your issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-zinc-200 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Message Description</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe your issue in detail. If applicable, add error messages or specific document details..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-zinc-900/50 border border-zinc-800 text-zinc-200 text-sm rounded-xl p-3.5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none placeholder-zinc-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !subject || !message}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 rounded-xl text-xs py-5.5 shadow-lg shadow-indigo-500/10 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Ticket
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
