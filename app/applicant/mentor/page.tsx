"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bot, Send, Sparkles, Trophy, Loader2, RefreshCw, Brain } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { MentorChatResponse, TrainingModule } from "@/lib/types";

interface Turn {
  id: string;
  role: "user" | "mentor";
  content: string;
}

export default function MentorPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>}>
      <MentorInner />
    </Suspense>
  );
}

function MentorInner() {
  const searchParams = useSearchParams();
  const skillParam = searchParams.get("skill");
  const { token, user } = useAuth();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [skill, setSkill] = useState<string>(skillParam ?? "");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [quiz, setQuiz] = useState<MentorChatResponse["quiz"]>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.training
      .listModules()
      .then(({ modules: list }) => setModules(list))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (skillParam) {
      setSkill(skillParam);
    }
  }, [skillParam]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isThinking]);

  const pickSkill = (nextSkill: string) => {
    if (nextSkill === skill) return;
    setSkill(nextSkill);
    setSessionId(null);
    setTurns([]);
    setQuiz(null);
    setCorrectCount(0);
  };

  const send = async (message: string) => {
    const text = message.trim();
    if (!text || !token || isThinking) return;

    setTurns((current) => [...current, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInput("");
    setQuiz(null);
    setIsThinking(true);

    try {
      const response = await api.mentor.chat({ skill: skill || undefined, message: text, sessionId: sessionId ?? undefined }, token);
      applyResponse(response);
    } catch (error) {
      setTurns((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "mentor",
          content: error instanceof Error ? error.message : "The mentor is unavailable right now.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const applyResponse = (response: MentorChatResponse) => {
    setSessionId(response.sessionId);
    setSkill((current) => current || response.skill);
    setCorrectCount(response.correctCount);
    setTurns((current) => [...current, { id: crypto.randomUUID(), role: "mentor", content: response.reply }]);
    setQuiz(response.quiz);
  };

  if (!token) {
    return (
      <div className="glass-card p-16 text-center space-y-4">
        <Bot className="w-12 h-12 text-sky-500 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-on-surface">Sign in to meet your coach</h2>
        <p className="text-slate-500">The AI mentor quizzes you topic-by-topic and tracks your accuracy.</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-sky-200 hover:scale-105 transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  const skills = ["", ...modules.map((module) => module.skill)];

  return (
    <div className="space-y-8">
      <section className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200">
            <Bot className="w-6 h-6" />
          </span>
          <h1 className="font-display text-4xl font-bold text-on-surface tracking-tight">AI Mentor</h1>
        </div>
        <p className="text-slate-500">Pick a skill, get coached live, and answer quiz questions topic-by-topic.</p>
      </section>

      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Choose a skill</p>
        <div className="flex flex-wrap gap-2">
          {skills.map((candidate) => (
            <button
              key={candidate || "general"}
              onClick={() => pickSkill(candidate)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                skill === candidate
                  ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white border-transparent shadow-lg shadow-sky-200"
                  : "bg-white/60 border-white/70 text-slate-500 hover:border-sky-300"
              }`}
            >
              {candidate || "General"}
            </button>
          ))}
        </div>
      </div>

      <section className="glass-card flex flex-col h-[560px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/50 bg-white/20">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Brain className="w-5 h-5" />
            </span>
            <div>
              <p className="font-bold text-on-surface text-sm">{skill ? `${skill} mentor` : "Your career coach"}</p>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online · quizzes answered {correctCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {correctCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <Trophy className="w-3.5 h-3.5" /> {correctCount} correct
              </span>
            )}
            <button
              onClick={() => {
                setSessionId(null);
                setTurns([]);
                setQuiz(null);
                setCorrectCount(0);
              }}
              className="p-2 text-slate-400 hover:text-sky-500 rounded-full hover:bg-white/50 transition-colors"
              title="New session"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {turns.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <Sparkles className="w-8 h-8 text-sky-300 mx-auto" />
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-6">
                Say hello, ask to practice a topic, or tap a skill chip above and I'll start coaching you with a lesson and a question.
              </p>
            </div>
          )}
          {turns.map((turn) => (
            <div key={turn.id} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-line px-5 py-3 rounded-3xl text-sm leading-6 ${
                  turn.role === "user"
                    ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-br-md"
                    : "bg-white/70 border border-white/70 text-slate-700 rounded-bl-md"
                }`}
              >
                {turn.content}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-white/70 border border-white/70 px-5 py-3 rounded-3xl rounded-bl-md text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> The mentor is thinking...
              </div>
            </div>
          )}

          {quiz && !isThinking && (
            <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Question {quiz.questionIndex}</p>
              <p className="font-semibold text-slate-800">{quiz.question}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quiz.options.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => send(String.fromCharCode(65 + index))}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-left bg-white/80 border border-white/80 text-slate-700 hover:border-sky-300 hover:bg-white transition-all"
                  >
                    <span className="font-black text-sky-500">{String.fromCharCode(65 + index)}.</span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="px-6 py-4 border-t border-white/50 bg-white/20 flex gap-3"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={quiz ? "Type your answer (e.g. B) or ask another question..." : "Ask the mentor anything..."}
            className="flex-1 bg-white/60 border border-white/70 rounded-full px-5 py-3 text-sm outline-none focus:ring-4 ring-sky-500/10 placeholder:text-slate-300"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-3.5 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-200 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </section>
    </div>
  );
}