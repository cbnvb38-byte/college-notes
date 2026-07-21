import { GenerationType } from "./types";
import { 
  FileText, 
  BookOpen, 
  GraduationCap, 
  HelpCircle, 
  User 
} from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { LucideProps } from "lucide-react";

export type StudyToolGroup = "Understand" | "Practice" | "Exam Prep" | "Doubt Solving";
export type StudyToolPriority = "primary" | "secondary";

export interface StudyToolConfig {
  id: string;
  generationType: GenerationType;
  title: string;
  description: string;
  group: StudyToolGroup;
  priority: StudyToolPriority;
  icon: ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;
  status: string;
  enabled: boolean;
}

export const STUDY_TOOLS: StudyToolConfig[] = [
  {
    id: "smart-summary",
    generationType: "summary",
    title: "Smart Summary",
    description: "Generate a clean summary with key concepts and exam points.",
    group: "Understand",
    priority: "primary",
    icon: FileText,
    status: "Active",
    enabled: true,
  },
  {
    id: "mcq-quiz",
    generationType: "mcq",
    title: "Practice Quiz",
    description: "Turn notes into MCQs with answers and explanations.",
    group: "Practice",
    priority: "primary",
    icon: BookOpen,
    status: "Active",
    enabled: true,
  },
  {
    id: "flashcards",
    generationType: "flashcards",
    title: "Flashcards",
    description: "Turn this note into quick revision flashcards.",
    group: "Practice",
    priority: "secondary",
    icon: GraduationCap,
    status: "Active",
    enabled: true,
  },
  {
    id: "important-questions",
    generationType: "important_questions",
    title: "Important Questions",
    description: "Extract the most likely exam questions from the text.",
    group: "Exam Prep",
    priority: "secondary",
    icon: HelpCircle,
    status: "Active",
    enabled: true,
  },

  {
    id: "ask-doubt",
    generationType: "doubt_answer",
    title: "Ask Doubt",
    description: "Ask questions directly from uploaded study material.",
    group: "Doubt Solving",
    priority: "primary",
    icon: User,
    status: "Active",
    enabled: true,
  },
];
