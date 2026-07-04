"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Search, BookOpen, ShieldCheck, Download, Copyright, User, AlertTriangle, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FAQItem {
  question: string;
  answer: string;
  category: "uploads" | "approval" | "downloads" | "copyright" | "account" | "reporting" | "rules";
}

const faqs: FAQItem[] = [
  {
    category: "uploads",
    question: "How do I upload notes to the platform?",
    answer: "To upload notes, navigate to the 'Upload Note' page via the sidebar navigation. Fill in the note details including title, description, subject branch, target semester, and select the PDF file. Once complete, click the upload button. Your notes will enter a pending state while admins review it."
  },
  {
    category: "uploads",
    question: "What file formats and sizes are supported?",
    answer: "Currently, we only support PDF format for notes to ensure cross-device compatibility and optimal viewing inside our responsive PDF reader. The maximum allowed file size is 15MB per document."
  },
  {
    category: "approval",
    question: "How long does the note approval process take?",
    answer: "Admins typically review and approve or reject submissions within 24 to 48 hours. You will receive an in-app notification once the status of your upload changes, and you can check the status anytime under 'My Notes'."
  },
  {
    category: "approval",
    question: "Why was my note submission rejected?",
    answer: "Notes are rejected if they are low quality (blurry, unreadable), duplicates of existing notes, contain copyrighted materials from external publishers, or violate our academic integrity rules. Specific rejection notes will be visible on your dashboard under the rejected upload."
  },
  {
    category: "downloads",
    question: "Are there any limits on downloading notes?",
    answer: "Registered users can download and view notes freely. However, to prevent automated scraping and abuse of the platform, we implement rate limits on the number of notes you can download in a single hour."
  },
  {
    category: "copyright",
    question: "What is the copyright policy regarding note sharing?",
    answer: "You must own the rights to the notes you upload. Uploading scanned pages from copyrighted textbooks, publisher-owned test banks, or lecture slides created by professors (without explicit permission) is strictly prohibited. Violating copyright will result in removal of content and potential account suspension."
  },
  {
    category: "account",
    question: "How do I manage my account profile and security?",
    answer: "You can update your personal information under the 'Profile' section and manage application preferences under 'Settings'. For security preferences and multi-factor authentication, visit the 'Account Security' page."
  },
  {
    category: "reporting",
    question: "How do I report inappropriate or copyrighted content?",
    answer: "If you find any notes that contain copyright infringements, academic dishonesty material, or spam, click the 'Report Content' option on the notes details card or contact support directly with the note ID and evidence."
  },
  {
    category: "rules",
    question: "What are the core community guidelines?",
    answer: "Our community thrives on collaboration, respect, and academic honesty. Members are expected to upload only high-quality educational content, respect copyright laws, help other students by sharing clean work, and maintain academic integrity. Plagiarism or posting cheating guides is strictly disallowed."
  }
];

const categories = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "uploads", label: "Uploading", icon: BookOpen },
  { id: "approval", label: "Approval Process", icon: ShieldCheck },
  { id: "downloads", label: "Downloading", icon: Download },
  { id: "copyright", label: "Copyright", icon: Copyright },
  { id: "account", label: "Account Management", icon: User },
  { id: "reporting", label: "Reporting", icon: AlertTriangle },
  { id: "rules", label: "Community Rules", icon: Scale }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h1>
        <p className="text-zinc-400 text-sm">
          Everything you need to know about sharing, downloading, and guidelines on College Notes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-zinc-200 rounded-xl"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                isActive
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                  : "bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* FAQs List */}
      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/40">
          <CardTitle className="text-sm font-bold text-zinc-200">Questions</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Click on any question below to see its detailed answer.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-800/40">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No matching FAQs found. Try searching for other terms.
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div key={index} className="transition-all duration-200 hover:bg-zinc-900/10">
                  <button
                    onClick={() => toggleExpand(index)}
                    className="flex justify-between items-center w-full px-6 py-4.5 text-left text-zinc-200 hover:text-zinc-50 font-medium text-sm transition-colors duration-200"
                  >
                    <span>{faq.question}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900/30 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
