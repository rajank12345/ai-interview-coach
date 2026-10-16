"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronRight, Clock3, RotateCcw, Send, Sparkles, Target, X } from "lucide-react";

type Difficulty = "Easy" | "Medium" | "Hard";
type Message = { role: "interviewer" | "candidate"; content: string };
type Report = { score: number; strengths: string[]; weaknesses: string[]; topics_to_revise: string[]; verdict: string; result: "PASS" | "FAIL" };
type Screen = "start" | "interview" | "report";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

async function api<T>(path: string, body: unknown): Promise<T> {
  if (!API_URL) {
    throw new Error("The API URL is not configured. Set NEXT_PUBLIC_API_URL and redeploy the frontend.");
  }
  const response = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Something went wrong. Please try again.");
  return data as T;
}

function Brand() {
  return <div className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>AI Interview Coach</span></div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("start");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function startInterview() {
    const clean = topic.trim();
    if (clean.length < 2) return setError("Enter a technical topic to begin.");
    setError(""); setLoading(true);
    try {
      const data = await api<{ message: string; is_complete: boolean }>("/api/interview/start", { topic: clean, difficulty });
      setTopic(clean); setMessages([{ role: "interviewer", content: data.message }]); setScreen("interview");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start the interview."); }
    finally { setLoading(false); }
  }

  async function submitAnswer() {
    const clean = answer.trim();
    if (!clean || loading) return;
    const next = [...messages, { role: "candidate" as const, content: clean }];
    setMessages(next); setAnswer(""); setError(""); setLoading(true);
    try {
      const data = await api<{ message: string; is_complete: boolean }>("/api/interview/answer", { topic, difficulty, conversation: next });
      const completed = [...next, { role: "interviewer" as const, content: data.message }];
      setMessages(completed);
      if (data.is_complete) { setScreen("report"); await generateReport(completed); }
    } catch (e) { setError(e instanceof Error ? e.message : "Your answer could not be sent."); }
    finally { setLoading(false); }
  }

  async function generateReport(transcript = messages) {
    setReport(null); setError(""); setLoading(true);
    try { setReport(await api<Report>("/api/interview/report", { topic, difficulty, conversation: transcript })); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not generate your report."); }
    finally { setLoading(false); }
  }

  function reset() { setScreen("start"); setTopic(""); setDifficulty("Medium"); setMessages([]); setAnswer(""); setReport(null); setError(""); }

  return <main className={`shell screen-${screen}`}>
    <header><Brand /><div className="status"><span></span> Groq AI · ready</div></header>

    {screen === "start" && <section className="start-layout">
      <div className="hero-copy">
        <div className="eyebrow"><span>01</span> PRACTICE UNDER PRESSURE</div>
        <h1>Think clearly.<br /><em>Answer better.</em></h1>
        <p>Realistic technical interviews that adapt to every answer—and honest feedback built from what you actually said.</p>
        <div className="proof"><span><Target size={17} /> Adaptive questions</span><span><Clock3 size={17} /> 10–15 minutes</span></div>
      </div>
      <div className="setup-card">
        <div className="card-number">SESSION SETUP <span>01 / 02</span></div>
        <label htmlFor="topic">What do you want to practice?</label>
        <input id="topic" autoFocus value={topic} onChange={e => { setTopic(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && startInterview()} placeholder="e.g. Binary Trees, React, System Design" />
        <div className="field-label"><span>Select difficulty</span><span className="optional">CALIBRATES QUESTION DEPTH</span></div>
        <div className="difficulty-grid">{(["Easy", "Medium", "Hard"] as Difficulty[]).map((level, i) => <button key={level} className={difficulty === level ? "active" : ""} onClick={() => setDifficulty(level)}><span>0{i + 1}</span>{level}<small>{level === "Easy" ? "Foundations" : level === "Medium" ? "Applied thinking" : "Systems & trade-offs"}</small></button>)}</div>
        {error && <div className="error"><X size={16} />{error}</div>}
        <button className="primary" onClick={startInterview} disabled={loading}>{loading ? <><span className="spinner" /> Preparing your interview…</> : <>Start interview <ArrowRight size={18} /></>}</button>
        <p className="privacy">No sign-up. No recordings. Just focused practice.</p>
      </div>
    </section>}

    {screen === "interview" && <section className="interview-layout">
      <aside className="session-rail">
        <div className="eyebrow"><span>02</span> LIVE SESSION</div>
        <h2>{topic}</h2><span className={`level ${difficulty.toLowerCase()}`}>{difficulty}</span>
        <div className="rail-rule" />
        <p>Answer as you would in a real interview. The interviewer will decide when it has enough signal.</p>
        <div className="signal"><span className="pulse" /> Interview in progress</div>
      </aside>
      <div className="chat-panel">
        <div className="chat-top"><div><span className="avatar">AI</span><p><strong>Technical Interviewer</strong><small>Evaluating reasoning & clarity</small></p></div><span className="message-count">{messages.filter(m => m.role === "candidate").length} ANSWERED</span></div>
        <div className="messages">
          {messages.map((message, i) => <div key={i} className={`message ${message.role}`}><span className="speaker">{message.role === "interviewer" ? "INTERVIEWER" : "YOU"}</span><p>{message.content}</p></div>)}
          {loading && <div className="message interviewer thinking"><span className="speaker">INTERVIEWER</span><p><i></i><i></i><i></i><span>Considering your answer</span></p></div>}
          <div ref={endRef} />
        </div>
        <div className="composer-wrap">
          {error && <div className="error"><X size={16} />{error} <button onClick={() => setError("")}>Dismiss</button></div>}
          <div className="composer"><textarea value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }} disabled={loading} placeholder="Type your answer…" rows={3} /><button onClick={submitAnswer} disabled={loading || !answer.trim()} aria-label="Send answer"><Send size={19} /></button></div>
          <p><kbd>ENTER</kbd> to send <span>·</span> <kbd>SHIFT + ENTER</kbd> for a new line</p>
        </div>
      </div>
    </section>}

    {screen === "report" && <section className="report-page">
      {loading && !report ? <div className="report-loading"><span className="loader-ring" /><div className="eyebrow">ASSESSING TRANSCRIPT</div><h2>Building your report</h2><p>Reviewing your reasoning, accuracy, and communication…</p></div> : error && !report ? <div className="report-loading error-state"><X size={30} /><h2>Report generation failed</h2><p>{error}</p><button className="primary" onClick={() => generateReport()}>Try again <RotateCcw size={17} /></button></div> : report && <>
        <div className="report-heading"><div><div className="eyebrow"><span>03</span> INTERVIEW COMPLETE</div><h1>Your performance,<br /><em>decoded.</em></h1><p>{topic} · {difficulty} interview</p></div><div className={`score-card ${report.score >= 70 ? "good" : report.score >= 55 ? "okay" : "weak"}`}><span>OVERALL SCORE</span><strong>{report.score}<small>/100</small></strong><div className="score-track"><i style={{ width: `${report.score}%` }} /></div><b>{report.result === "PASS" ? <Check size={18} /> : <X size={18} />}{report.result}</b></div></div>
        <div className="report-grid">
          <ReportBlock index="01" title="What you did well" items={report.strengths} tone="positive" />
          <ReportBlock index="02" title="Areas to improve" items={report.weaknesses} tone="negative" />
          <ReportBlock index="03" title="Revise next" items={report.topics_to_revise} tone="neutral" />
          <article className="report-block verdict"><div className="block-title"><span>04</span><h3>Interviewer verdict</h3></div><p>{report.verdict}</p></article>
        </div>
        <div className="report-footer"><p>Every interview is a new data point.<br />Keep building the signal.</p><button className="primary" onClick={reset}>Start new interview <ArrowRight size={18} /></button></div>
      </>}
    </section>}
    <footer><span>PRIVATE PRACTICE SESSION</span><span>BUILT FOR BETTER INTERVIEWS</span></footer>
  </main>;
}

function ReportBlock({ index, title, items, tone }: { index: string; title: string; items: string[]; tone: string }) {
  return <article className={`report-block ${tone}`}><div className="block-title"><span>{index}</span><h3>{title}</h3></div><ul>{items.map((item, i) => <li key={i}><ChevronRight size={16} />{item}</li>)}</ul></article>;
}
