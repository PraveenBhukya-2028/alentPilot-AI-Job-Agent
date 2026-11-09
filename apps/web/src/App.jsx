import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Bell, BriefcaseBusiness, Building2,
  CalendarDays, Check, ChevronDown, CircleHelp, Clock3, FileText,
  Filter, LayoutDashboard, LogOut, Menu, MessageSquareText, Plus,
  Search, Sparkles, Target, TrendingUp, UploadCloud, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis
} from "recharts";
import { api, token } from "./api";

const sampleJobs = [
  { id:"demo-northstar-digital", title:"Frontend Engineer (React)", company:"Northstar Digital", location:"London, UK", salary:"£45,000–£55,000", employment:"Full-time", remote:true, skills:["React","TypeScript","JavaScript","Testing"], match:{score:94,matched:["React","TypeScript"],missing:["Testing"]} },
  { id:"demo-finbridge", title:"React Developer", company:"Finbridge", location:"Canary Wharf, London", salary:"£42,000–£52,000", employment:"Full-time", remote:false, skills:["React","Redux","CSS","REST APIs"], match:{score:88,matched:["React","Redux"],missing:["REST APIs"]} },
  { id:"demo-cedar-labs", title:"Full Stack JavaScript Engineer", company:"Cedar Labs", location:"Hybrid · London", salary:"£50,000–£62,000", employment:"Full-time", remote:true, skills:["Next.js","Node.js","PostgreSQL","TypeScript"], match:{score:82,matched:["Next.js","TypeScript"],missing:["PostgreSQL"]} },
  { id:"demo-orbit-works", title:"AI Product Engineer", company:"Orbit Works", location:"Remote · UK", salary:"£48,000–£60,000", employment:"Full-time", remote:true, skills:["TypeScript","OpenAI API","React","Node.js"], match:{score:78,matched:["React","TypeScript"],missing:["OpenAI API"]} }
];

const chartData = [
  {name:"Mon",apps:2},{name:"Tue",apps:4},{name:"Wed",apps:3},
  {name:"Thu",apps:6},{name:"Fri",apps:5},{name:"Sat",apps:8},{name:"Sun",apps:7}
];

const nav = [
  {label:"Overview",icon:LayoutDashboard},
  {label:"Find jobs",icon:Search},
  {label:"Applications",icon:BriefcaseBusiness},
  {label:"Resume studio",icon:FileText},
  {label:"Interview prep",icon:MessageSquareText}
];

const statusLabels = {
  SAVED:"Saved", APPLIED:"Applied", SCREENING:"Screening",
  INTERVIEW:"Interview", OFFER:"Offer", REJECTED:"Rejected",
  WITHDRAWN:"Withdrawn"
};

function AuthScreen({onAuth}) {
  const [mode,setMode] = useState("login");
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api(`/auth/${mode}`, {
        method:"POST",
        body:JSON.stringify({name,email,password})
      });
      localStorage.setItem("aja_token",r.token);
      onAuth(r.user);
    } catch(err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-art">
        <div className="brand">
          <span className="brand-mark"><Zap size={18}/></span> talent<span>pilot</span>
        </div>
        <div className="auth-copy">
          <div className="eyebrow"><Sparkles size={14}/> YOUR NEXT MOVE STARTS HERE</div>
          <h1>Make your next career move <em>with clarity.</em></h1>
          <p>One intelligent workspace to discover opportunities, understand your fit and move every application forward.</p>
          <div className="auth-mini">
            <div><strong>94%</strong><small>Top match score</small></div>
            <div><strong>4.2×</strong><small>More organised</small></div>
            <div><strong>1 place</strong><small>For your job search</small></div>
          </div>
        </div>
        <div className="auth-foot">Designed for ambitious people building what’s next.</div>
      </div>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <div className="mobile-brand brand">
            <span className="brand-mark"><Zap size={18}/></span> talent<span>pilot</span>
          </div>
          <div className="eyebrow">WELCOME {mode==="login"?"BACK":"ABOARD"}</div>
          <h2>{mode==="login"?"Sign in to your workspace":"Create your workspace"}</h2>
          <p className="muted">Your career pipeline, thoughtfully organised.</p>

          {mode==="register" && (
            <label>Full name
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required/>
            </label>
          )}

          <label>Email address
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
          </label>

          <label>Password
            <input type="password" minLength="8" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" required/>
          </label>

          {error && <div className="error">{error}</div>}

          <button className="btn primary full" disabled={busy}>
            {busy?"Please wait…":mode==="login"?"Sign in":"Create account"}
          </button>

          <p className="switch-auth">
            {mode==="login"?"New to TalentPilot?":"Already have an account?"}
            {" "}
            <button type="button" onClick={()=>setMode(mode==="login"?"register":"login")}>
              {mode==="login"?"Create an account":"Sign in"}
            </button>
          </p>

          <div className="auth-note">
            <CircleHelp size={14}/> Your data is private to your account. Demo jobs are sample listings.
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [user,setUser] = useState(null);
  const [page,setPage] = useState("Overview");
  const [jobs,setJobs] = useState(sampleJobs);
  const [apps,setApps] = useState([]);
  const [resumes,setResumes] = useState([]);
  const [query,setQuery] = useState("");
  const [location,setLocation] = useState("");
  const [employmentFilter,setEmploymentFilter] = useState("");
  const [jobSource,setJobSource] = useState("sample");
  const [searchBusy,setSearchBusy] = useState(false);
  const [toast,setToast] = useState("");
  const [busy,setBusy] = useState(false);
  const [selected,setSelected] = useState(null);
  const [mobileOpen,setMobileOpen] = useState(false);
  const [aiResult,setAiResult] = useState("");

  useEffect(()=>{
    if(token()) {
      api("/auth/me")
        .then(r=>setUser(r.user))
        .catch(()=>localStorage.removeItem("aja_token"));
    }
  },[]);

  useEffect(()=>{
    if(!user) return;
    Promise.all([api("/jobs"),api("/applications"),api("/resumes")])
      .then(([j,a,r])=>{
        setJobs(j.jobs.length ? j.jobs : sampleJobs);
        setJobSource(j.jobs.length ? "database" : "sample");
        setApps(a.applications);
        setResumes(r.resumes);
      })
      .catch(e=>notify(e.message));
  },[user]);

  function notify(msg) {
    setToast(msg);
    setTimeout(()=>setToast(""),3500);
  }

  async function refresh() {
    const [a,r] = await Promise.all([api("/applications"),api("/resumes")]);
    setApps(a.applications);
    setResumes(r.resumes);
  }

  async function searchLiveJobs() {
    if(!query.trim() && !location.trim()) {
      notify("Enter a job title or location first.");
      return;
    }

    setSearchBusy(true);
    try {
      const params = new URLSearchParams();
      if(query.trim()) params.set("q",query.trim());
      if(location.trim()) params.set("location",location.trim());
      if(employmentFilter) params.set("employment",employmentFilter);

      const result = await api(`/jobs/live?${params.toString()}`);
      setJobs(result.jobs);
      setJobSource("adzuna");

      if(!result.jobs.length) notify("No live jobs found. Try a broader keyword or location.");
      else notify(`Found ${result.count} live jobs from Adzuna.`);
    } catch(e) {
      notify(e.message);
    } finally {
      setSearchBusy(false);
    }
  }

  async function addApplication(job) {
    try {
      const payload = {
        company:job.company,
        role:job.title,
        status:"SAVED",
        matchScore:job.match?.score
      };

      if(job.source==="Adzuna") {
        payload.notes = job.sourceUrl ? `Apply through Adzuna: ${job.sourceUrl}` : "Found on Adzuna";
      } else {
        payload.jobId = job.id;
      }

      await api("/applications",{
        method:"POST",
        body:JSON.stringify(payload)
      });

      await refresh();
      notify("Added to your application tracker.");
    } catch(e) {
      notify(e.message);
    }
  }

  function handleApply(job) {
    if(!job.sourceUrl) {
      notify("Employer application link is not available.");
      return;
    }

    window.open(job.sourceUrl,"_blank","noopener,noreferrer");
    addApplication(job);
  }

  async function changeStatus(id,status) {
    try {
      await api(`/applications/${id}`,{
        method:"PATCH",
        body:JSON.stringify({status})
      });
      await refresh();
      notify("Application updated.");
    } catch(e) {
      notify(e.message);
    }
  }

  async function uploadResume(e) {
    const f = e.target.files?.[0];
    if(!f) return;

    const form = new FormData();
    form.append("resume",f);
    setBusy(true);

    try {
      await api("/resumes/upload",{method:"POST",body:form});
      await refresh();
      notify("Resume uploaded and analysed.");
    } catch(err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function tailor() {
    if(!selected) return;
    setBusy(true);
    try {
      const r = await api("/ai/tailor",{
        method:"POST",
        body:JSON.stringify({
          jobDescription:selected.description || selected.title+" at "+selected.company
        })
      });
      setAiResult(r.result);
    } catch(e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(
    ()=>jobs.filter(j=>
      (`${j.title} ${j.company} ${j.skills?.join(" ")}`.toLowerCase().includes(query.toLowerCase())) &&
      j.location.toLowerCase().includes(location.toLowerCase())
    ),
    [jobs,query,location]
  );

  if(!user) return <AuthScreen onAuth={setUser}/>;

  const counts = {
    total:apps.length,
    applied:apps.filter(a=>["APPLIED","SCREENING","INTERVIEW","OFFER"].includes(a.status)).length,
    interviews:apps.filter(a=>a.status==="INTERVIEW").length,
    offers:apps.filter(a=>a.status==="OFFER").length
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen?"open":""}`}>
        <div className="brand">
          <span className="brand-mark"><Zap size={18}/></span> talent<span>pilot</span>
        </div>
        <div className="workspace-label">WORKSPACE</div>

        <div className="nav-list">
          {nav.map(n=>(
            <button key={n.label} className={`nav-item ${page===n.label?"active":""}`} onClick={()=>{
              setPage(n.label);
              setMobileOpen(false);
            }}>
              <n.icon size={17}/>
              {n.label}
              {n.label==="Applications" && apps.length>0 && <span className="nav-count">{apps.length}</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Sparkles size={16}/></div>
            <strong>Your next move, made clearer.</strong>
            <p>Keep your search focused and your momentum visible.</p>
            <button onClick={()=>setPage("Find jobs")}>Explore opportunities <ArrowUpRight size={14}/></button>
          </div>

          <div className="profile-mini">
            <div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.headline || "Candidate workspace"}</small>
            </div>
            <button title="Sign out" onClick={()=>{
              localStorage.removeItem("aja_token");
              setUser(null);
            }}>
              <LogOut size={16}/>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}>
            <Menu size={19}/>
          </button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div>
          <div className="top-actions">
            <span className="live-dot">Workspace active</span>
            <button className="icon-btn" title="Notifications"><Bell size={18}/></button>
            <div className="avatar small">{user.name?.slice(0,1).toUpperCase()}</div>
          </div>
        </header>

        <div className="content">
          {page==="Overview" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">SUNDAY, YOUR CAREER WORKSPACE</div>
                  <h1>Good to see you, {user.name.split(" ")[0]} <span>✦</span></h1>
                  <p>Here’s your job search at a glance. Small steps add up.</p>
                </div>
                <button className="btn primary" onClick={()=>setPage("Find jobs")}><Search size={16}/> Discover jobs</button>
              </div>

              <div className="stat-grid">
                <Stat icon={BriefcaseBusiness} label="Tracked opportunities" value={counts.total} hint="Across your pipeline" color="violet"/>
                <Stat icon={SendIcon} label="In progress" value={counts.applied} hint="Applied or beyond" color="blue"/>
                <Stat icon={CalendarDays} label="Interviews" value={counts.interviews} hint="Keep preparing" color="amber"/>
                <Stat icon={Target} label="Offers" value={counts.offers} hint="The goal in sight" color="green"/>
              </div>

              <div className="dashboard-grid">
                <section className="panel activity-panel">
                  <div className="panel-head">
                    <div><h3>Search activity</h3><p>Your weekly momentum</p></div>
                    <span className="select-chip">This week <ChevronDown size={13}/></span>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{top:10,right:8,left:-22,bottom:0}}>
                        <defs>
                          <linearGradient id="fillApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b7cff" stopOpacity={.3}/>
                            <stop offset="100%" stopColor="#8b7cff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#20283a" vertical={false}/>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:"#778198",fontSize:11}}/>
                        <Tooltip contentStyle={{background:"#141b2a",border:"1px solid #283248",borderRadius:10,color:"#fff"}}/>
                        <Area type="monotone" dataKey="apps" stroke="#9b8cff" strokeWidth={2.5} fill="url(#fillApps)"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-foot">
                    <span><i/> Activity illustration · connect your workflow to track actual progress</span>
                    <strong><TrendingUp size={14}/> Stay consistent</strong>
                  </div>
                </section>

                <section className="panel focus-panel">
                  <div className="panel-head">
                    <div><h3>Career focus</h3><p>Your workspace checklist</p></div>
                    <Sparkles size={17} className="purple"/>
                  </div>
                  <FocusItem icon={FileText} title="Upload your latest CV" desc={resumes.length?"Your latest CV is on file":"Add a CV to unlock match insights"} done={!!resumes.length} onClick={()=>setPage("Resume studio")}/>
                  <FocusItem icon={Search} title="Explore relevant roles" desc="Find opportunities that fit your skills" done={false} onClick={()=>setPage("Find jobs")}/>
                  <FocusItem icon={BriefcaseBusiness} title="Track applications" desc={`${apps.length} opportunities currently tracked`} done={apps.length>0} onClick={()=>setPage("Applications")}/>
                </section>
              </div>

              <section className="section-block">
                <div className="section-title">
                  <div><h3>Recommended opportunities</h3><p>Explore roles aligned with your direction</p></div>
                  <button className="text-btn" onClick={()=>setPage("Find jobs")}>View all jobs <ArrowUpRight size={14}/></button>
                </div>
                <div className="job-grid">
                  {jobs.slice(0,3).map(j=>(
                    <JobCard key={j.id} job={j} onOpen={()=>setSelected(j)} onAdd={()=>addApplication(j)} onApply={()=>handleApply(j)}/>
                  ))}
                </div>
              </section>
            </>
          )}

          {page==="Find jobs" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">OPPORTUNITY DISCOVERY</div>
                  <h1>Find your next role</h1>
                  <p>Search live UK vacancies from Adzuna or explore your saved opportunities.</p>
                </div>
                <span className="select-chip"><Filter size={14}/> {filtered.length} results</span>
              </div>

              <div className="search-bar live-search-bar">
                <Search size={18}/>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Role, company or skill…"/>
                <div className="search-divider"/>
                <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="UK location or postcode…"/>
                <select aria-label="Employment type" value={employmentFilter} onChange={e=>setEmploymentFilter(e.target.value)}>
                  <option value="">Any type</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                </select>
                <button className="btn primary" onClick={searchLiveJobs} disabled={searchBusy}>
                  <Search size={14}/>{searchBusy?"Searching…":"Search live jobs"}
                </button>
              </div>

              <div className="live-search-meta">
                <span>{jobSource==="adzuna"?"Live results powered by Adzuna":jobSource==="database"?"Your saved database listings":"Sample listings · run a live search to see current vacancies"}</span>
                {jobSource==="adzuna" && <a href="https://www.adzuna.co.uk/" target="_blank" rel="noreferrer">Adzuna job search ↗</a>}
              </div>

              <div className="job-list">
                {filtered.map(j=>(
                  <JobCard key={j.id} job={j} onOpen={()=>setSelected(j)} onAdd={()=>addApplication(j)} onApply={()=>handleApply(j)}/>
                ))}
              </div>
              {jobSource==="adzuna" && filtered.length===0 && <EmptyInline text="No matching jobs in these results. Try another keyword or location."/>}
            </>
          )}

          {page==="Applications" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR CAREER PIPELINE</div>
                  <h1>Application tracker</h1>
                  <p>Keep every opportunity moving forward.</p>
                </div>
                <button className="btn secondary" onClick={()=>setPage("Find jobs")}><Plus size={16}/> Add opportunity</button>
              </div>

              <div className="pipeline">
                {["SAVED","APPLIED","SCREENING","INTERVIEW","OFFER"].map(s=>(
                  <div className="pipeline-col" key={s}>
                    <div className="pipeline-head">
                      <span>{statusLabels[s]}</span>
                      <b>{apps.filter(a=>a.status===s).length}</b>
                    </div>
                    {apps.filter(a=>a.status===s).map(a=>(
                      <div className="pipeline-card" key={a.id}>
                        <strong>{a.role}</strong>
                        <small>{a.company}</small>
                        <select value={a.status} onChange={e=>changeStatus(a.id,e.target.value)}>
                          {Object.entries(statusLabels).map(([k,v])=><option value={k} key={k}>{v}</option>)}
                        </select>
                      </div>
                    ))}
                    {apps.filter(a=>a.status===s).length===0 && <div className="empty-mini">Nothing here yet</div>}
                  </div>
                ))}
              </div>
              {apps.length===0 && <Empty title="Your pipeline starts here" desc="Save a role from Find jobs and track it through every stage." action={()=>setPage("Find jobs")} actionLabel="Explore jobs"/>}
            </>
          )}

          {page==="Resume studio" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR CAREER STORY</div>
                  <h1>Resume studio</h1>
                  <p>Keep your latest CV ready and understand how it maps to a role.</p>
                </div>
              </div>

              <div className="resume-layout">
                <div className="panel upload-panel">
                  <div className="upload-illustration"><UploadCloud size={26}/></div>
                  <h3>Upload your CV</h3>
                  <p>PDF format · Maximum 8 MB · Text-based PDFs work best</p>
                  <label className="btn primary upload-btn">
                    {busy?"Uploading…":"Choose PDF"}
                    <input type="file" accept="application/pdf" onChange={uploadResume} hidden disabled={busy}/>
                  </label>
                  <div className="privacy-note"><Check size={14}/> Your resume is stored privately against your account.</div>
                </div>

                <div className="panel">
                  <div className="panel-head">
                    <div><h3>Resume library</h3><p>Your uploaded documents</p></div>
                    <FileText size={18} className="muted-icon"/>
                  </div>
                  {resumes.length ? resumes.map(r=>(
                    <div className="resume-row" key={r.id}>
                      <div className="file-icon"><FileText size={18}/></div>
                      <div><strong>{r.fileName}</strong><small>Added {new Date(r.createdAt).toLocaleDateString()}</small></div>
                      <span className="status-pill success">Processed</span>
                    </div>
                  )) : <EmptyInline text="No resume uploaded yet."/>}
                </div>
              </div>
            </>
          )}

          {page==="Interview prep" && <InterviewPanel notify={notify} setResult={setAiResult} result={aiResult}/>}
        </div>
      </main>

      {selected && (
        <div className="modal-backdrop" onClick={()=>{setSelected(null);setAiResult("");}}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close icon-btn" onClick={()=>{setSelected(null);setAiResult("");}}><X size={18}/></button>
            <div className="eyebrow">OPPORTUNITY DETAILS</div>
            <h2>{selected.title}</h2>
            <p className="muted">{selected.company} · {selected.location}</p>

            <div className="modal-meta">
              <span>{selected.salary || "Salary not listed"}</span>
              <span>{selected.employment}</span>
              {selected.remote && <span>Remote-friendly</span>}
            </div>

            <h4>Skills & experience</h4>
            <div className="tag-row">
              {(selected.skills||[]).map(s=><span className="skill-tag" key={s}>{s}</span>)}
            </div>

            <p className="modal-desc">{selected.description || "Explore this opportunity and compare it with your experience."}</p>

            {selected.match && (
              <div className="match-panel">
                <div><strong>{selected.match.score}%</strong><span>Indicative skills overlap</span></div>
                <p>
                  Matched: {selected.match.matched?.join(", ") || "Upload a CV to calculate"}
                  <br/>
                  Potential gaps: {selected.match.missing?.join(", ") || "None identified"}
                </p>
              </div>
            )}

            {selected.source==="Adzuna" && selected.sourceUrl && (
              <a className="btn secondary external-apply" href={selected.sourceUrl} target="_blank" rel="noreferrer">
                View listing & apply <ArrowUpRight size={14}/>
              </a>
            )}

            <div className="modal-actions">
              <button className="btn secondary" onClick={tailor}>
                <Sparkles size={15}/> {busy?"Analysing…":"Analyse with AI"}
              </button>
              <button className="btn primary" onClick={()=>{addApplication(selected);setSelected(null);}}>
                <Plus size={15}/> Save opportunity
              </button>
            </div>

            {aiResult && <div className="ai-result"><strong>AI career coach</strong><p>{aiResult}</p></div>}
          </div>
        </div>
      )}

      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    </div>
  );
}

function SendIcon(p) {
  return <ArrowUpRight {...p}/>;
}

function Stat({icon:Icon,label,value,hint,color}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon size={18}/></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  );
}

function FocusItem({icon:Icon,title,desc,done,onClick}) {
  return (
    <button className="focus-item" onClick={onClick}>
      <span className={`focus-check ${done?"done":""}`}>
        {done?<Check size={13}/>:<Icon size={15}/>}
      </span>
      <span><strong>{title}</strong><small>{desc}</small></span>
      <ArrowUpRight size={15}/>
    </button>
  );
}

function JobCard({job,onOpen,onAdd,onApply}) {
  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="company-avatar">{job.company?.slice(0,1)}</div>
        <div className="job-card-title">
          <h4>{job.title}</h4>
          <p><Building2 size={13}/>{job.company}</p>
        </div>
        <button className="more-btn" onClick={onOpen}>•••</button>
      </div>

      <div className="job-details">
        <span><Activity size={13}/>{job.location}</span>
        <span><Clock3 size={13}/>{job.employment || "Full-time"}</span>
      </div>

      <div className="tag-row">
        {(job.skills||[]).slice(0,4).map(s=><span className="skill-tag" key={s}>{s}</span>)}
      </div>

      <div className="job-card-bottom">
        <div>
          <strong>{job.salary || "Salary not listed"}</strong>
          <small>{job.remote?"Remote-friendly":"On-site / Hybrid"}</small>
          {job.source==="Adzuna" && (
            <a className="adzuna-credit" href="https://www.adzuna.co.uk/" target="_blank" rel="noreferrer">Adzuna</a>
          )}
        </div>

        <div className="job-actions">
          <button className="btn small secondary" onClick={onOpen}>Details</button>
          {job.sourceUrl && (
            <button className="btn small primary" onClick={onApply}>
              <ArrowUpRight size={14}/> Apply Now
            </button>
          )}
          <button className="btn small secondary" onClick={onAdd}>
            <Plus size={14}/> Save
          </button>
        </div>
      </div>
    </article>
  );
}

function Empty({title,desc,action,actionLabel}) {
  return (
    <div className="empty-state">
      <div className="empty-symbol"><BriefcaseBusiness size={22}/></div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <button className="btn primary" onClick={action}>{actionLabel}</button>
    </div>
  );
}

function EmptyInline({text}) {
  return <div className="empty-inline">{text}</div>;
}

function InterviewPanel({notify,setResult,result}) {
  const [role,setRole] = useState("Frontend Developer (React)");
  const [level,setLevel] = useState("Mid-level");
  const [busy,setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const r = await api("/ai/interview",{
        method:"POST",
        body:JSON.stringify({role,level})
      });
      setResult(r.result);
    } catch(e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PRACTICE WITH PURPOSE</div>
          <h1>Interview preparation</h1>
          <p>Generate a focused practice set for the role you want.</p>
        </div>
      </div>

      <div className="panel interview-panel">
        <div className="interview-icon"><MessageSquareText size={22}/></div>
        <h3>Build your interview practice set</h3>
        <p>Get technical, scenario-based and behavioural questions tailored to your target role.</p>

        <div className="form-grid">
          <label>Target role<input value={role} onChange={e=>setRole(e.target.value)}/></label>
          <label>Experience level
            <select value={level} onChange={e=>setLevel(e.target.value)}>
              <option>Junior</option>
              <option>Mid-level</option>
              <option>Senior</option>
            </select>
          </label>
        </div>

        <button className="btn primary" onClick={generate} disabled={busy}>
          <Sparkles size={15}/>{busy?"Preparing questions…":"Generate practice questions"}
        </button>

        {result && <div className="ai-result"><strong>Your practice set</strong><p>{result}</p></div>}
      </div>
    </>
  );
}

export default App;