import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { B as Button } from "./button-DjOZMqFS.mjs";
import { B as Briefcase, S as Sparkles, A as ArrowRight, T as Target, j as SlidersVertical, W as WandSparkles, f as ShieldCheck, k as Mic, c as Search, F as FileText } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
function Landing() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground font-sans", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex h-16 max-w-6xl items-center justify-between px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-2xl tracking-tight text-primary", children: "CareerOS" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#simulator", className: "transition-colors hover:text-foreground", children: "Interactive Demo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#how-to-apply", className: "transition-colors hover:text-foreground", children: "Application Guide" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#features", className: "transition-colors hover:text-foreground", children: "Core Features" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "ghost", size: "sm", className: "text-sm font-medium", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", children: "Sign in" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", className: "shadow-soft text-sm font-medium", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/register", children: "Get started" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden border-b border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 -z-10 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px] animate-pulse-glow", style: {
          animationDelay: "0s"
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow", style: {
          animationDelay: "2.5s"
        } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 pt-20 md:pt-28 text-center space-y-8 animate-fade-in-up", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 backdrop-blur-sm px-4 py-1 text-xs font-semibold text-primary shadow-soft mx-auto font-sans", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 text-accent-foreground animate-float" }),
          " Your AI Job-Search Copilot"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-5xl tracking-tight md:text-7xl leading-tight max-w-4xl mx-auto", children: [
          "Land the role.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary italic", children: "Skip the busywork." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-3xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed font-sans", children: "Personalized job search grounded in your private knowledge base: discover roles from across the internet, calculate match ranks, tailor resumes and cover letters, explore career tracks, close skill gaps with curated learning resources, and prepare for interviews using custom behavioral STAR drills." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap justify-center gap-4 pt-2 font-sans", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "shadow-lift px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/register", children: [
            "Start tailored search ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-2 h-4 w-4" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", variant: "outline", className: "px-8 bg-transparent border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", children: "I have an account" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-8 border-t border-border/60 grid grid-cols-3 gap-6 max-w-2xl mx-auto font-sans", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-display text-primary", children: "10x" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: "Application speed" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-display text-primary", children: "Browser Ext." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: "Clip jobs in 1-click" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-display text-primary", children: "STAR Drills" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: "Practice story answers" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "how-to-apply", className: "border-b border-border bg-muted/20 py-24 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold uppercase tracking-[0.2em] text-primary", children: "Workflow Strategy" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-4xl tracking-tight md:text-5xl", children: "How to effectively apply for jobs step-by-step" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm max-w-xl", children: "Most job seekers fail by blindly spamming applications. Follow our proven, structured checklist to convert submissions into interviews." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-16 grid gap-6 md:grid-cols-5 relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold", children: "01" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors", children: "Assess the Match" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-2 leading-relaxed", children: [
              "Upload your master profile. Paste job URLs to calculate your skill & semantic match. Apply ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "only" }),
              " if fit score is above 70% to save time."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-3 w-3" }),
            " Focus on high-fit targets"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold", children: "02" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors", children: "Optimize Keywords" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2 leading-relaxed", children: "Tailor your resume highlighting core achievements matching the job post. Keep formatting clean and remove any columns that confuse parsing." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { className: "h-3 w-3" }),
            " Beat the parser check"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold", children: "03" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors", children: "Draft a Hook" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2 leading-relaxed", children: "Draft cover letters mapping exactly to their pain points. Detail specific projects from your background that solve problems they described." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-3 w-3" }),
            " Relate experience directly"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold", children: "04" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors", children: "Audit & Cleanse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2 leading-relaxed", children: "Run a secondary automated quality check. Eliminate grammar issues, verify strong action verbs, and ensure impact values are quantified." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3 w-3" }),
            " Zero formatting issues"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold", children: "05" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors", children: "Practice STAR Drills" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2 leading-relaxed", children: "Prepare STAR frameworks (Situation, Task, Action, Result) mapped to critical requirements. Practice speaking answers using real drills." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "h-3 w-3" }),
            " Ready for conversations"
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "features", className: "mx-auto max-w-6xl px-6 py-24 space-y-16 animate-fade-in-up", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl text-left space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold uppercase tracking-[0.2em] text-primary", children: "Core Utilities" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-4xl tracking-tight md:text-5xl", children: "Smarter tooling built for the modern application cycle" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: features.map((f, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft flex flex-col justify-between group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(f.icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl text-foreground group-hover:text-primary transition-colors", children: f.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground leading-relaxed", children: f.desc })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border/40 pt-4 mt-6 text-[10px] uppercase font-mono tracking-wider text-muted-foreground/60", children: f.meta })
      ] }, f.title)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-6xl px-6 py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-3xl border border-border bg-gradient-primary px-8 py-16 text-center text-primary-foreground shadow-lift relative md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl -z-10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-4xl tracking-tight md:text-6xl text-primary-foreground", children: "Take command of your search." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-4 max-w-md text-sm md:text-base text-primary-foreground/85", children: "Free to get started. Build tailored profiles, prep STAR answers, and get direct evaluation feedback instantly." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 flex justify-center gap-3 flex-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", variant: "secondary", className: "px-8 font-medium", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/register", children: [
        "Create free account ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-2 h-4 w-4" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t border-border py-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-xs text-muted-foreground md:flex-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-lg tracking-tight text-primary", children: "CareerOS" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#simulator", className: "hover:text-foreground transition-colors", children: "Simulator" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#how-to-apply", className: "hover:text-foreground transition-colors", children: "Guide" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#features", className: "hover:text-foreground transition-colors", children: "Features" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " CareerOS. Crafted for career acceleration."
      ] }) })
    ] }) })
  ] });
}
const features = [{
  icon: Search,
  title: "Intelligent Extraction",
  desc: "Simply import any job posting URL. Our parser extracts the critical tasks, target requirements, and company mission.",
  meta: "Automated scraping"
}, {
  icon: Sparkles,
  title: "Semantic Match Scoring",
  desc: "Calculate a structural match percentage. Understand where your profile aligns and what technical gaps are present.",
  meta: "Semantic parsing"
}, {
  icon: WandSparkles,
  title: "ATS-Grade Resumes",
  desc: "Adjust and compile tailored PDF resumes and cover letters designed to align with matching search queries.",
  meta: "Interactive compiler"
}, {
  icon: ShieldCheck,
  title: "Double-Agent Verification",
  desc: "A secondary review pass flags formatting concerns, missing active verbs, and filters out awkward phrasing.",
  meta: "Guardrail critique"
}, {
  icon: Mic,
  title: "Structured STAR Drills",
  desc: "Create custom behavioral drill practice templates based directly on achievements highlighted on your profile.",
  meta: "Voice prep integration"
}, {
  icon: FileText,
  title: "Document Library",
  desc: "Centralize profile iterations, job description parameters, and tailored cover letters in a clean local vault.",
  meta: "Secure database vault"
}];
export {
  Landing as component
};
