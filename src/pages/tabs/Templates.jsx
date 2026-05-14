/**
 * GrowthPILOT — Templates Library
 * File: src/pages/tabs/Templates.jsx
 *
 * 50+ templates LinkedIn organisés par catégorie et niche
 * Clic sur un template → injecte dans Create
 */

import { useState } from "react";
import { t as tr } from "../../translations.js";
import { PageHeader } from "./shared.js";

const CATEGORIES = (lang) => [
  { id:"all",         label:tr(lang,"templates.catAll")        || "All Templates",   icon:"✨" },
  { id:"hook",        label:tr(lang,"templates.catHooks")      || "Hooks",           icon:"⚡" },
  { id:"story",       label:tr(lang,"templates.catStory")      || "Story",           icon:"📖" },
  { id:"authority",   label:tr(lang,"templates.catAuthority")  || "Authority",       icon:"🏆" },
  { id:"framework",   label:tr(lang,"templates.catFrameworks") || "Frameworks",      icon:"📋" },
  { id:"viral",       label:tr(lang,"templates.catViral")      || "Viral",           icon:"🔥" },
  { id:"contrarian",  label:tr(lang,"templates.catContrarian") || "Contrarian",      icon:"🎯" },
  { id:"listicle",    label:tr(lang,"templates.catLists")      || "Lists",           icon:"📝" },
  { id:"lesson",      label:tr(lang,"templates.catLessons")    || "Lessons Learned", icon:"💡" },
  { id:"cta",         label:tr(lang,"templates.catCta")        || "CTA / Offer",     icon:"📣" },
];

const TEMPLATES = [
  // ─── HOOKS ───────────────────────────────────────────────────────────────────
  { id:1,  cat:"hook",      title:"The Shocking Stat",        icon:"📊",
    prompt:"Start with a shocking or counterintuitive statistic about [TOPIC]. Then explain why most people are wrong about it, what the data actually means, and end with a question asking for their take.",
    example:"99% of LinkedIn posts get zero traction.\n\nNot because the content is bad.\nBecause the hook is invisible.\n\nHere's what the top 1% do differently..." },

  { id:2,  cat:"hook",      title:"The Bold Claim",           icon:"💥",
    prompt:"Open with a bold, controversial claim about [TOPIC] that will polarize your audience. Back it up with 3 concrete reasons. Challenge the status quo.",
    example:"Cold calling is dead.\n\nI said it. And I'll die on this hill.\n\nHere's why the best salespeople in 2026 never pick up the phone..." },

  { id:3,  cat:"hook",      title:"The Confession",           icon:"😬",
    prompt:"Start with a personal confession or mistake related to [TOPIC]. Make it specific and vulnerable. Then share what you learned from it.",
    example:"I wasted €50,000 on Facebook ads before I understood one thing.\n\nAttention is rented. Authority is owned.\n\nHere's what I'd do differently..." },

  { id:4,  cat:"hook",      title:"The Pattern Interrupt",    icon:"🔀",
    prompt:"Start with something completely unexpected about [TOPIC]. Break the pattern the reader expects. Use contrast or surprise to stop the scroll.",
    example:"The best marketing book I've ever read has zero pages.\n\nIt's not a book at all.\n\nIt's this tweet from 2019 that changed how I think about growth..." },

  { id:5,  cat:"hook",      title:"The 'Everyone is wrong'",  icon:"❌",
    prompt:"Open by challenging conventional wisdom about [TOPIC]. State clearly that the popular advice is wrong, then explain the counterintuitive truth.",
    example:"Everyone tells you to post every day on LinkedIn.\n\nThis advice is killing your growth.\n\nHere's what the algorithm actually rewards..." },

  // ─── STORY ────────────────────────────────────────────────────────────────────
  { id:6,  cat:"story",     title:"The STAR Story",           icon:"⭐",
    prompt:"Write a personal story using STAR framework (Situation, Task, Action, Result) about [TOPIC]. Make it relatable and end with a clear business lesson.",
    example:"18 months ago, I had 47 LinkedIn followers.\n\nMy posts were getting 3 likes (all from my mom).\n\nI was invisible.\n\nThen I changed one thing..." },

  { id:7,  cat:"story",     title:"The Before/After",         icon:"🔄",
    prompt:"Describe a transformation journey related to [TOPIC]. Start with the painful 'before' state, explain the turning point, then show the 'after' results with specific numbers.",
    example:"Before: 14-hour days, zero traction, burning out.\n\nAfter: 6-hour days, 10x revenue, waiting list of clients.\n\nOne mindset shift made the difference..." },

  { id:8,  cat:"story",     title:"The Failure Story",        icon:"💔",
    prompt:"Share a specific failure or setback related to [TOPIC]. Be honest and vulnerable. Extract 3 key lessons that others can learn from your mistake.",
    example:"I shut down my first startup after 14 months.\n\nWe had great tech, great team, and zero customers.\n\nHere's the 3 brutal lessons I'll never forget..." },

  { id:9,  cat:"story",     title:"The Client Win",           icon:"🏆",
    prompt:"Tell the story of a client success related to [TOPIC]. Focus on their specific problem, your solution, and the measurable results achieved.",
    example:"A client came to me 90 days ago spending €15k/month on ads.\n\nROAS: 0.8. Business on life support.\n\nHere's exactly what we changed (and the results)..." },

  { id:10, cat:"story",     title:"The Industry Observation", icon:"👁️",
    prompt:"Share an observation you've made in your industry about [TOPIC] that most people haven't noticed yet. Add your unique analysis.",
    example:"I've reviewed 200+ LinkedIn profiles this month.\n\nThe same mistake appears on 90% of them.\n\nAnd it's costing people thousands in lost opportunities..." },

  // ─── AUTHORITY ────────────────────────────────────────────────────────────────
  { id:11, cat:"authority", title:"The Expert Opinion",       icon:"🎓",
    prompt:"Share your expert perspective on a trending debate in [TOPIC]. Take a clear stance, back it with experience, and invite discussion.",
    example:"Hot take: most 'growth hacks' are just shortcuts to irrelevance.\n\nAfter 8 years in growth marketing, here's what actually compounds..." },

  { id:12, cat:"authority", title:"The Prediction",           icon:"🔮",
    prompt:"Make a bold prediction about the future of [TOPIC]. Explain your reasoning with 3 data points or trends. Invite readers to agree or disagree.",
    example:"In 2 years, 80% of B2B content teams will be replaced.\n\nNot by AI. By the 20% who learned how to use AI.\n\nHere's what I see coming..." },

  { id:13, cat:"authority", title:"The Myth Buster",          icon:"🔨",
    prompt:"Identify 3 common myths about [TOPIC]. Debunk each one with data, experience, or logic. End with the uncomfortable truth.",
    example:"3 LinkedIn myths that are costing you followers:\n\n❌ Myth 1: More posts = more reach\n❌ Myth 2: Hashtags matter in 2026\n❌ Myth 3: Going viral grows your business..." },

  { id:14, cat:"authority", title:"The Hot Take",             icon:"🌶️",
    prompt:"Share a genuinely controversial opinion about [TOPIC] that you hold strongly. Explain your reasoning clearly. Be prepared to defend it.",
    example:"Productivity culture is making you less productive.\n\nThere. I said it.\n\nHere's why the 'hustle harder' crowd has it completely backwards..." },

  { id:15, cat:"authority", title:"The Data Drop",            icon:"📈",
    prompt:"Share a specific data point or research finding about [TOPIC] that most people don't know. Explain what it means and what action it suggests.",
    example:"A 2026 study of 10,000 LinkedIn posts found one pattern.\n\nPosts with a single clear idea outperformed multi-point posts by 340%.\n\nHere's what that means for your content strategy..." },

  // ─── FRAMEWORKS ────────────────────────────────────────────────────────────────
  { id:16, cat:"framework", title:"The 3-Step Formula",       icon:"📐",
    prompt:"Explain your 3-step framework or process for achieving a specific result in [TOPIC]. Make each step actionable and concrete.",
    example:"The 3-step formula I use to write LinkedIn posts that convert:\n\nStep 1: Hook (first line stops the scroll)\nStep 2: Body (deliver 3x more value than expected)\nStep 3: CTA (one specific action)..." },

  { id:17, cat:"framework", title:"The 5-Point List",         icon:"📋",
    prompt:"Create a practical list of 5 specific, actionable tips about [TOPIC]. Each point should be implementable immediately.",
    example:"5 things I do every Monday to grow on LinkedIn:\n\n1. Review last week's best-performing post\n2. Write 3 new posts in advance\n3. Comment on 10 posts in my niche\n4. Check DMs and reply\n5. Update my content calendar..." },

  { id:18, cat:"framework", title:"The Comparison",           icon:"⚖️",
    prompt:"Compare two approaches to [TOPIC]. Show what most people do (wrong way) vs what high-performers do (right way). Use specific examples.",
    example:"Average founder: posts whenever inspired\nTop founder: posts on a system\n\nAverage founder: writes for everyone\nTop founder: writes for one specific person\n\nThe difference? €0 vs €100k in inbound..." },

  { id:19, cat:"framework", title:"The Action Plan",          icon:"🗺️",
    prompt:"Give a specific 30-day action plan for achieving [TOPIC]. Break it into weeks with clear milestones.",
    example:"Want 1,000 real LinkedIn followers in 30 days?\n\nWeek 1: Foundation (profile + 7 posts)\nWeek 2: Consistency (daily + engage)\nWeek 3: Amplify (comment strategy)\nWeek 4: Optimize (double down on what works)..." },

  { id:20, cat:"framework", title:"The Decision Matrix",      icon:"🎯",
    prompt:"Create a simple decision framework to help readers choose between options related to [TOPIC]. Use clear criteria.",
    example:"How to decide which content format to use:\n\nChoose long-form if: you're establishing authority\nChoose short-form if: you want fast reach\nChoose carousel if: you're teaching a process\nChoose video if: personality is your brand..." },

  // ─── VIRAL ────────────────────────────────────────────────────────────────────
  { id:21, cat:"viral",     title:"The Listicle Bomb",        icon:"💣",
    prompt:"Write a punchy numbered list of insights about [TOPIC]. Each point should be self-contained and shareable. Aim for 7-10 items.",
    example:"10 things I wish I knew before starting my business:\n\n1. Revenue beats everything\n2. Your first hire will define your culture\n3. Say no to 90% of opportunities\n4. Cash flow kills more startups than competition..." },

  { id:22, cat:"viral",     title:"The Thread Starter",       icon:"🧵",
    prompt:"Write the opening post of a LinkedIn thread about [TOPIC] that makes people want to save and share. Tease the full value without giving everything away.",
    example:"I spent 3 years studying the 100 fastest-growing personal brands on LinkedIn.\n\nHere's the exact playbook they all follow (and almost nobody talks about):\n\n🔽" },

  { id:23, cat:"viral",     title:"The Quick Win",            icon:"⚡",
    prompt:"Share one specific, actionable quick win related to [TOPIC] that readers can implement today in under 10 minutes.",
    example:"One LinkedIn change that took me 5 minutes and doubled my profile views:\n\nI rewrote my headline from my job title to who I help and how.\n\nBefore: 'CEO at GrowthPILOT'\nAfter: 'Helping founders build authority on LinkedIn | AI Content OS'..." },

  { id:24, cat:"viral",     title:"The Resource Drop",        icon:"🎁",
    prompt:"Share a curated list of 5-7 valuable resources (tools, books, frameworks) related to [TOPIC]. Add your specific recommendation for each.",
    example:"7 tools that changed how I create content (and I pay for all of them):\n\n1. [TOOL]: For [specific use case]\n2. [TOOL]: For [specific use case]..." },

  { id:25, cat:"viral",     title:"The Case Study",           icon:"🔬",
    prompt:"Share a detailed case study about a specific success story related to [TOPIC]. Include the problem, process, and results with exact numbers.",
    example:"How we went from 0 to €50k MRR in 6 months without paid ads:\n\nMonth 1: [specific action] → [specific result]\nMonth 2: [specific action] → [specific result]..." },

  // ─── CONTRARIAN ────────────────────────────────────────────────────────────────
  { id:26, cat:"contrarian", title:"The Unpopular Opinion",   icon:"🙅",
    prompt:"Share a genuinely unpopular opinion about [TOPIC]. Explain why most people believe the opposite and why they're wrong. Be respectful but direct.",
    example:"Unpopular opinion: consistency is overrated.\n\nI know, I know. Every LinkedIn guru preaches 'post every day.'\n\nBut here's what they don't tell you..." },

  { id:27, cat:"contrarian", title:"The Reverse Take",        icon:"🔃",
    prompt:"Take the conventional wisdom about [TOPIC] and argue the exact opposite. Back your contrarian view with at least 2 solid reasons.",
    example:"Everyone says 'your network is your net worth.'\n\nI say: your depth beats your width every time.\n\nHere's why 100 real relationships beats 10,000 connections..." },

  { id:28, cat:"contrarian", title:"The Devil's Advocate",    icon:"😈",
    prompt:"Play devil's advocate on a popular belief about [TOPIC]. Present both sides fairly, then land on your actual stance.",
    example:"Let me defend a position I don't actually hold:\n\n'AI will replace all writers within 3 years.'\n\nHere's the strongest case for it — and why I still think it's wrong..." },

  // ─── LISTICLE ─────────────────────────────────────────────────────────────────
  { id:29, cat:"listicle",  title:"Things Nobody Tells You",  icon:"🤫",
    prompt:"Share 5-7 things nobody tells you about [TOPIC]. Focus on honest, insider knowledge that most people discover too late.",
    example:"Things nobody tells you about being a solo founder:\n\n• The loneliness is real\n• You'll question yourself every week\n• Your first 100 users will teach you more than 10 years in corporate\n• Sleep is a competitive advantage..." },

  { id:30, cat:"listicle",  title:"The Signs You're Ready",   icon:"✅",
    prompt:"Create a checklist of signs that someone is ready for [TOPIC]. Make it relatable and encouraging.",
    example:"Signs you're ready to go full-time on your business:\n\n✅ You've had 3+ paying clients\n✅ Your side income covers 6 months of expenses\n✅ You wake up excited about the work\n✅ Your employer has become your biggest distraction..." },

  { id:31, cat:"listicle",  title:"Mistakes to Avoid",        icon:"⚠️",
    prompt:"List the top 5 mistakes people make when dealing with [TOPIC]. For each, explain why it happens and how to avoid it.",
    example:"5 LinkedIn mistakes killing your reach in 2026:\n\n1. Starting posts with 'I am excited to share'\n2. Posting without engaging for 2 hours after\n3. Using 30 hashtags (it's 2019 thinking)\n4. Pitching in comments\n5. Ignoring DMs for 24+ hours..." },

  { id:32, cat:"listicle",  title:"Books That Changed Me",    icon:"📚",
    prompt:"Share 5 books that changed how you think about [TOPIC]. For each, give one specific insight that stuck with you.",
    example:"5 books that completely changed how I think about [TOPIC]:\n\n1. [Book]: The one idea I still use daily is...\n2. [Book]: Changed my view on...\n3. [Book]: Made me realize..." },

  // ─── LESSONS LEARNED ─────────────────────────────────────────────────────────
  { id:33, cat:"lesson",    title:"Year in Review",           icon:"🗓️",
    prompt:"Share the most important lessons you learned this year about [TOPIC]. Be specific, honest, and include both wins and failures.",
    example:"12 months of building in public. Here's what I actually learned:\n\nWhat worked: [specific]\nWhat failed spectacularly: [specific]\nBiggest surprise: [specific]\nWhat I'm doubling down on: [specific]..." },

  { id:34, cat:"lesson",    title:"The Hard Truth",           icon:"💊",
    prompt:"Share a hard truth about [TOPIC] that you had to learn the painful way. Be honest about the cost of not knowing it earlier.",
    example:"The hard truth nobody told me about building an audience:\n\nYou will create 100 pieces of content before anyone cares.\n\nNot 10. Not 20. 100.\n\nHere's how to make those 100 count..." },

  { id:35, cat:"lesson",    title:"What I'd Tell My Past Self", icon:"⏪",
    prompt:"Write a letter to your past self about [TOPIC]. What would you tell yourself 3-5 years ago? Be specific.",
    example:"If I could go back 5 years and give myself one piece of advice about [TOPIC]:\n\nStop optimizing the product. Start obsessing over the customer.\n\nHere's what I mean..." },

  { id:36, cat:"lesson",    title:"The Pivot Story",          icon:"🔀",
    prompt:"Share a story about a major pivot you made in [TOPIC]. What triggered it, how you executed it, and what you learned.",
    example:"6 months ago, I almost quit.\n\nThe business wasn't working. The market wasn't listening.\n\nThen I made one uncomfortable decision that changed everything..." },

  // ─── CTA / OFFER ─────────────────────────────────────────────────────────────
  { id:37, cat:"cta",       title:"The Value Offer",          icon:"🎯",
    prompt:"Create a compelling soft offer related to [TOPIC]. Clearly state who it's for, what you're offering, and how to get it. No hard sell.",
    example:"I'm opening 3 spots this month for a free 30-minute content audit.\n\nWho it's for: Founders who post consistently but aren't getting traction.\n\nWhat you'll get: A specific, actionable plan to 3x your reach.\n\nDM me 'AUDIT' if you want one of the spots." },

  { id:38, cat:"cta",       title:"The Question Post",        icon:"❓",
    prompt:"Ask a thought-provoking question about [TOPIC] that will generate comments and discussion. The question should have no single right answer.",
    example:"Quick question for my network:\n\nIf you could only keep ONE marketing channel for the next 12 months, what would it be and why?\n\nMy answer in the comments ↓" },

  { id:39, cat:"cta",       title:"The Poll Alternative",     icon:"🗳️",
    prompt:"Create a post that generates discussion by presenting two opposing approaches to [TOPIC] and asking readers to choose sides.",
    example:"Hot debate in my DMs lately:\n\nTeam A: 'Niche down. Be the go-to person for ONE thing.'\nTeam B: 'Stay broad. More reach, more opportunities.'\n\nWhere do you stand — and why?" },

  { id:40, cat:"cta",       title:"The Community Builder",    icon:"🤝",
    prompt:"Write a post that builds community around [TOPIC]. Invite readers to share their experiences or introduce themselves.",
    example:"If you're building something in [NICHE] right now, drop a comment below:\n\n• What you're working on\n• Your biggest challenge\n• One win from this week\n\nLet's support each other 👇" },

  // ─── BONUS TEMPLATES ─────────────────────────────────────────────────────────
  { id:41, cat:"viral",     title:"The Behind The Scenes",    icon:"🎬",
    prompt:"Give readers a behind-the-scenes look at your process, day, or decision-making related to [TOPIC]. Raw and unfiltered.",
    example:"What my actual Monday looks like as a solo founder:\n\n6am: Review metrics (10 min)\n7am: Write content (45 min)\n8am: Customer calls (2h)\n...\n\nNo hustle porn. Just the reality." },

  { id:42, cat:"authority", title:"The Industry Report",      icon:"📋",
    prompt:"Share insights from your experience or observation of trends in [TOPIC]. Position yourself as someone with a bird's eye view.",
    example:"After speaking with 50+ founders this quarter, here's what I'm seeing:\n\n→ [Trend 1]\n→ [Trend 2]\n→ [Trend 3]\n\nThe patterns are hard to ignore..." },

  { id:43, cat:"story",     title:"The Turning Point",        icon:"🌅",
    prompt:"Share the exact moment or conversation that changed your trajectory in [TOPIC]. Be specific about what was said or what happened.",
    example:"One sentence changed my entire approach to business.\n\nIt came from a call with a mentor in 2023.\n\nHe said: 'Stop trying to be interesting. Focus on being useful.'\n\nI've built everything differently since." },

  { id:44, cat:"framework", title:"The Anti-Checklist",       icon:"🚫",
    prompt:"Create a 'stop doing' list related to [TOPIC]. Things that sound productive but actually hurt results.",
    example:"Stop doing these 5 things immediately if you want to grow on LinkedIn:\n\n🚫 Stop posting links (kills reach)\n🚫 Stop using 'I'm excited to announce'\n🚫 Stop broadcasting. Start conversing.\n🚫 Stop measuring likes. Measure DMs.\n🚫 Stop optimizing for followers. Optimize for buyers." },

  { id:45, cat:"lesson",    title:"The ROI Reality Check",    icon:"💰",
    prompt:"Share an honest analysis of the real ROI (time, money, energy) of [TOPIC]. Be specific about what the numbers actually look like.",
    example:"The real ROI of LinkedIn content (after 2 years of data):\n\nTime invested: 5h/week\nFollowers gained: 12,000\nDirect revenue attributed: €180k\nInbound leads: 340\n\nThe math only works if you're consistent. Here's my system..." },

  { id:46, cat:"hook",      title:"The Open Loop",            icon:"🔓",
    prompt:"Start a post with an intriguing open loop that creates curiosity about [TOPIC]. The reader must keep reading to get closure.",
    example:"I almost didn't post this.\n\nWhat I'm about to share goes against everything I've said publicly about [TOPIC].\n\nBut after what happened last month, I have to be honest..." },

  { id:47, cat:"contrarian","title":"The Sacred Cow",         icon:"🐄",
    prompt:"Challenge a widely-held belief in your industry about [TOPIC] that nobody dares to question. Use data or specific examples.",
    example:"The sacred cow of [INDUSTRY] that nobody questions:\n\n'You need to [popular belief].'\n\nI've built a [X] business without ever doing this.\n\nHere's what I do instead..." },

  { id:48, cat:"story",     title:"The Mentor Moment",        icon:"🧑‍🏫",
    prompt:"Share advice you received from a mentor, boss, or experienced person related to [TOPIC] that proved to be transformational.",
    example:"Best advice I ever got about [TOPIC]:\n\nIt came from my first real mentor.\n\nHe said: '[QUOTE]'\n\nI didn't understand it then. 3 years later, I live by it." },

  { id:49, cat:"framework", title:"The Weekly Ritual",        icon:"🔁",
    prompt:"Share your weekly ritual or system for staying on top of [TOPIC]. Make it specific enough to be immediately replicable.",
    example:"My exact weekly ritual for [TOPIC] (that I've done for 18 months straight):\n\nMonday: [specific]\nWednesday: [specific]\nFriday: [specific]\n\n30 minutes total. Here's why it works..." },

  { id:50, cat:"cta",       title:"The Honest Ask",           icon:"🙋",
    prompt:"Make a direct, honest ask of your audience related to [TOPIC]. Be transparent about what you need and why.",
    example:"Real talk: I'm building something new and I need your help.\n\nI'm creating a [PRODUCT/SERVICE] for [SPECIFIC AUDIENCE].\n\nIf that's you, I'd love 15 minutes of your time to ask 5 questions.\n\nNo pitch. Just research. DM me 'HELP' if you're in." },
];

export default function Templates({ trendsLang, isMobile, setPost, setTopic, setTab, showToast }) {
  const [activeCat,  setActiveCat]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState(null);

  const filtered = TEMPLATES.filter(t => {
    const matchCat    = activeCat === "all" || t.cat === activeCat;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.prompt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const useTemplate = (tpl) => {
    setPost(tpl.example + "\n\n[Edit this draft or generate a fresh version →]");
    setTopic(tpl.title);
    showToast(tr(trendsLang,"templates.loaded"));
    setTab("create");
  };

  const s = {
    wrap:    { display:"flex", flexDirection:"column", gap:16, paddingBottom:40 },
    catBtn:  (active) => ({ padding:"7px 14px", borderRadius:20, border: active ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.07)", background: active ? "rgba(239,68,68,0.1)" : "transparent", color: active ? "#ef4444" : "#475569", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s" }),
    card:    (selected) => ({ background: selected ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)", border: selected ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px", cursor:"pointer", transition:"all 0.2s" }),
    input:   { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
    btn:     { background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:8, color:"#fff", fontSize:11, fontWeight:700, letterSpacing:"1px", padding:"10px 18px", cursor:"pointer" },
    btnGhost:{ background:"transparent", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#94a3b8", fontSize:11, fontWeight:700, padding:"9px 14px", cursor:"pointer" },
    preview: { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:16 },
  };

  return (
    <div style={s.wrap}>
      <PageHeader tabKey="templates" trendsLang={trendsLang} isMobile={isMobile} />

      {/* Search */}
      <input style={s.input} placeholder={tr(trendsLang,"templates.search")} value={search} onChange={e => setSearch(e.target.value)} />

      {/* Category filter */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {CATEGORIES(trendsLang).map(c => (
          <button key={c.id} style={s.catBtn(activeCat === c.id)} onClick={() => setActiveCat(c.id)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div style={{ color:"#475569", fontSize:11, fontWeight:700 }}>{filtered.length} {tr(trendsLang,"templates.templates")}</div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:10 }}>
        {filtered.map(tpl => (
          <div key={tpl.id} style={s.card(selected?.id === tpl.id)} onClick={() => setSelected(selected?.id === tpl.id ? null : tpl)}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom: selected?.id === tpl.id ? 12 : 0 }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{tpl.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:13, marginBottom:2 }}>{tpl.title}</div>
                <div style={{ color:"#475569", fontSize:11 }}>{tr(trendsLang,`templates.cat${tpl.cat.charAt(0).toUpperCase()+tpl.cat.slice(1)}`) || tpl.cat.toUpperCase()}</div>
              </div>
              <span style={{ color:"#ef4444", fontSize:16 }}>{selected?.id === tpl.id ? "▲" : "▼"}</span>
            </div>

            {selected?.id === tpl.id && (
              <div>
                {/* Prompt */}
                <div style={{ color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"1px", marginBottom:6 }}>{tr(trendsLang,"templates.promptLabel")}</div>
                <div style={{ ...s.preview, marginBottom:12, fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>
                  {tpl.prompt}
                </div>

                {/* Example */}
                <div style={{ color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"1px", marginBottom:6 }}>{tr(trendsLang,"templates.exampleLabel")}</div>
                <div style={{ ...s.preview, marginBottom:14, fontSize:12, color:"#e2e8f0", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
                  {tpl.example}
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <button style={s.btn} onClick={() => useTemplate(tpl)}>
                    {tr(trendsLang,"templates.useTemplate")}
                  </button>
                  <button style={s.btnGhost} onClick={() => { setTopic(tpl.title); setTab("create"); showToast(tr(trendsLang,"templates.topicSet")); }}>
                    Generate Fresh →
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
