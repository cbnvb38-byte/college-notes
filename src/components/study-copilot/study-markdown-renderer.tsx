"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface StudyMarkdownRendererProps {
  content: string;
}

export function StudyMarkdownRenderer({ content }: StudyMarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none prose-sm text-zinc-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-zinc-100 mt-6 mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-indigo-300 mt-5 mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-bold text-zinc-200 mt-4 mb-2" {...props} />,
          p: ({ node, ...props }) => <p className="leading-relaxed mb-3 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-indigo-400 font-medium [&>li]:text-zinc-300" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed marker:text-indigo-500" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-zinc-100" {...props} />,
          code: ({ node, inline, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-zinc-800/60 text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-zinc-700/50" {...props} />
              );
            }
            return (
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/50 my-3 overflow-x-auto">
                <code className="text-xs font-mono text-zinc-300" {...props} />
              </div>
            );
          },
          table: ({ node, ...props }) => (
            <div className="w-full overflow-x-auto my-4 rounded-xl border border-zinc-800/50">
              <table className="w-full text-sm text-left border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="bg-zinc-900/80 p-3 font-bold text-zinc-200 border-b border-zinc-800/50" {...props} />,
          td: ({ node, ...props }) => <td className="p-3 border-b border-zinc-800/30 text-zinc-300 bg-zinc-950/30" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
