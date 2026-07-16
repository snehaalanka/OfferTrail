import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, Sparkles, AlertCircle, BookOpen, MessageSquare, ArrowRight, Check, X } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const features = [
    {
      icon: <LayoutGrid className="w-5 h-5 text-[#2d632a]" />,
      title: 'Company Tracking',
      desc: 'Organize your applications, deadlines, and statuses in a clean, Notion-style database table.'
    },
    {
      icon: <FileText className="w-5 h-5 text-[#2d632a]" />,
      title: 'Resume Management',
      desc: 'Keep multiple tailored versions of your resume and quickly set primary CV structures.'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#2d632a]" />,
      title: 'Job Description Analysis',
      desc: 'Parse target job descriptions to identify key tech stacks, skills, and resume matching scores.'
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-[#2d632a]" />,
      title: 'Skill Gap Tracking',
      desc: 'Visualize which competencies are missing from your resume and see what needs to be learned.'
    },
    {
      icon: <BookOpen className="w-5 h-5 text-[#2d632a]" />,
      title: 'Learning Workspace',
      desc: 'Track topic preparation levels with 5-dot indicators and store quick revision notes.'
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-[#2d632a]" />,
      title: 'Interview Notes',
      desc: 'Log questions asked in each round, interviewer feedback, and post-interview reflections.'
    }
  ];

  const steps = [
    {
      number: 'Step 1',
      title: 'Add a company',
      desc: 'Save companies you want to apply to with packages, roles, and deadlines.'
    },
    {
      number: 'Step 2',
      title: 'Paste the Job Description',
      desc: 'Atlas highlights the target skills and automatically analyzes your resume match score.'
    },
    {
      number: 'Step 3',
      title: 'Track your preparation',
      desc: 'Check off study topics, revise quick notes, and monitor your prep progress.'
    },
    {
      number: 'Step 4',
      title: 'Reflect after interviews',
      desc: 'Log interview questions, feedback, and compile revision guidelines for next time.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-notion-text-main font-sans selection:bg-[#2e4024]/10 selection:text-[#2d632a] scroll-smooth">
      
      {/* Premium Navbar */}
      <nav className="h-16 border-b border-notion-border bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <span className="w-4.5 h-4.5 rounded-full border-2 border-notion-text-main flex items-center justify-center shrink-0"></span>
          <span className="font-semibold text-base tracking-tight">OFFERTRAIL</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[14.5px] text-notion-text-sub font-light">
          <a href="#features" className="hover:text-notion-text-main transition-colors">Features</a>
          <a href="#workflow" className="hover:text-notion-text-main transition-colors">Method</a>
          <a href="#why-atlas" className="hover:text-notion-text-main transition-colors">Why OfferTrail</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogin}
            className="px-3.5 py-1.5 text-[14px] text-notion-text-sub hover:text-notion-text-main transition-colors cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={handleRegister}
            className="px-4 py-1.5 bg-[#2d632a] hover:bg-[#2e4024] text-white text-[13.5px] font-medium rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto py-24 px-8 text-center animate-fade-in">
        <h1 className="font-serif text-[56px] font-normal tracking-tight leading-[1.1] text-notion-text-main mb-6">
          Your Personal <br />
          <span className="text-[#2d632a]">Placement Workspace.</span>
        </h1>
        <p className="text-[17.5px] text-notion-text-sub font-light max-w-xl mx-auto leading-relaxed mb-8">
          OfferTrail is a Notion-inspired placement hub designed for students. Organize application deadlines, track resume match scores, identify skill gaps, and log interview reflections—all in one minimal space.
        </p>
        <div className="flex items-center justify-center gap-3.5">
          <button
            onClick={handleRegister}
            className="px-6 py-2.5 bg-[#2d632a] hover:bg-[#2e4024] text-white text-[14.5px] font-medium rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 bg-white border border-notion-border hover:border-slate-300 text-[14.5px] font-medium rounded-xl hover:bg-[#efefed] transition-colors shadow-2xs cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="bg-white border-y border-notion-border py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-[32px] font-normal tracking-tight text-notion-text-main mb-3">
              Features built for placement preparation
            </h2>
            <p className="text-[15px] text-notion-text-sub font-light max-w-md mx-auto leading-relaxed">
              Consolidate lists, study trackers, and preparation logs inside a streamlined placement dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="border border-notion-border rounded-xl p-6 hover:border-slate-300 hover:shadow-xs transition-all duration-200 bg-[#fafaf9]/20"
              >
                <div className="p-2 bg-emerald-50/50 border border-emerald-100/50 rounded-lg inline-block mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-[15.5px] text-notion-text-main mb-2">
                  {feat.title}
                </h3>
                <p className="text-[13.5px] text-notion-text-sub font-light leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Workflow Section */}
      <section id="workflow" className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-[32px] font-normal tracking-tight text-notion-text-main mb-3">
              Streamline your workflow
            </h2>
            <p className="text-[15px] text-notion-text-sub font-light max-w-sm mx-auto leading-relaxed">
              Four simple steps to track, study, and pass placement rounds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white border border-notion-border rounded-xl p-5 shadow-3xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-[#2d632a] uppercase tracking-wider bg-emerald-50 border border-emerald-100/30 px-2 py-0.5 rounded-full inline-block mb-3.5">
                    {step.number}
                  </span>
                  <h3 className="font-semibold text-[15px] text-notion-text-main mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-notion-text-sub font-light leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Atlas Comparison Section */}
      <section id="why-atlas" className="bg-white border-t border-notion-border py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-[32px] font-normal tracking-tight text-notion-text-main mb-3">
              Why OfferTrail?
            </h2>
            <p className="text-[15px] text-notion-text-sub font-light max-w-md mx-auto leading-relaxed">
              Stop context-switching between sheets, drive directories, and local text files.
            </p>
          </div>

          {/* Comparison table */}
          <div className="border border-notion-border rounded-xl bg-white shadow-xs overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-notion-border bg-[#fafaf9] text-notion-text-sub select-none text-[13px] font-medium">
                  <th className="py-3 px-6 w-1/2">The Scattered Way</th>
                  <th className="py-3 px-6 w-1/2 text-[#2d632a] bg-emerald-50/10">The Atlas Way</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f1ef] text-[13.5px] leading-relaxed text-notion-text-sub">
                <tr>
                  <td className="py-3.5 px-6 flex items-start gap-2.5">
                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Application links lost in browser bookmarks</span>
                  </td>
                  <td className="py-3.5 px-6 text-notion-text-main font-medium bg-emerald-50/10">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#2d632a] shrink-0 mt-0.5" />
                      <span>Notion-style database with real-time status</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 flex items-start gap-2.5">
                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Manually matching CV terms against jobs</span>
                  </td>
                  <td className="py-3.5 px-6 text-notion-text-main font-medium bg-emerald-50/10">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#2d632a] shrink-0 mt-0.5" />
                      <span>Instant ATS match scores and skill gap lists</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 flex items-start gap-2.5">
                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Interview notes and revision sheets scattered in folders</span>
                  </td>
                  <td className="py-3.5 px-6 text-notion-text-main font-medium bg-emerald-50/10">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#2d632a] shrink-0 mt-0.5" />
                      <span>Linked workspaces compiling notes and logs</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 flex items-start gap-2.5">
                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Difficulty checking which topics need revision</span>
                  </td>
                  <td className="py-3.5 px-6 text-notion-text-main font-medium bg-emerald-50/10">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#2d632a] shrink-0 mt-0.5" />
                      <span>Revision reminders and 5-dot level trackers</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#fafaf9] border-t border-notion-border py-12 px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-[13.5px] text-notion-text-sub font-light">
          
          {/* Logo & copyright */}
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border border-notion-text-sub flex items-center justify-center shrink-0"></span>
            <span>© {new Date().getFullYear()} Atlas Workspace.</span>
          </div>

          {/* Links list */}
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <a href="#" className="hover:text-notion-text-main transition-colors">About</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-notion-text-main transition-colors">GitHub</a>
            <a href="#" className="hover:text-notion-text-main transition-colors">Contact</a>
            <a href="#" className="hover:text-notion-text-main transition-colors">Privacy Policy</a>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Landing;
