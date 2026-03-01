'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersIcon, RefreshIcon, SpinnerIcon, ChevronDownIcon, PlusIcon, PencilIcon, CheckIcon, XIcon, SearchIcon, CpuIcon, PackageIcon, DatabaseIcon, FolderIcon, ClockIcon, SlidersIcon, TagIcon, HashIcon, PlayIcon, CrosshairIcon, ShieldIcon, GlobeIcon, FilterIcon, NetworkIcon, EyeIcon } from './icons.js';
import {
  getAgentProfilesWithStatus, getAgentProfile, updateAgentFile, createAgent, createAgentJob,
  getAvailableMcpTools, getLlmProviders,
  getAgentAssignments, getAllAgentAssignments, assignProgramsToAgent,
  unassignProgramFromAgent, getProgramsForAssignment, getTargetsForPrograms,
  getAgentWorkspace,
} from '../actions.js';
import { OrgChartView } from './agents-orgchart.js';
import { AgentWorkspace } from './agent-workspace.js';

const PROVIDER_MODELS = {
  anthropic: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini', 'o3-mini'],
  google: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  custom: [],
};

const ROLE_OPTIONS = ['Recon', 'Exploitation', 'Reporting', 'Infrastructure', 'Research', 'Analysis', 'Development', 'Custom'];
const SPEC_OPTIONS = ['Web', 'API', 'Mobile', 'Cloud', 'Network', 'Blockchain', 'IoT', 'Social Engineering', 'Custom'];
const RUN_MODES = ['manual', 'scheduled', 'continuous', 'event-triggered'];
const SOUL_TEMPLATES = {
  recon: `# {{CODENAME}}\n\nYou are {{NAME}}, an autonomous reconnaissance specialist.\n\n## Mission\nDiscover and enumerate all attack surface for the assigned target.\n\n## Approach\n- Start with passive reconnaissance\n- Enumerate subdomains, ports, services\n- Identify technologies and frameworks\n- Map the application architecture\n- Document all findings systematically\n\n## Personality\n- Methodical and thorough\n- Never skip steps\n- Always verify findings`,
  exploit: `# {{CODENAME}}\n\nYou are {{NAME}}, an autonomous exploitation specialist.\n\n## Mission\nIdentify and validate security vulnerabilities in assigned targets.\n\n## Approach\n- Analyze attack surface from recon data\n- Test for common vulnerability classes (OWASP Top 10)\n- Develop and validate proof-of-concept exploits\n- Assess impact and severity\n- Document reproduction steps clearly\n\n## Personality\n- Creative and persistent\n- Ethical — never cause damage\n- Report accurately, no exaggeration`,
  report: `# {{CODENAME}}\n\nYou are {{NAME}}, an autonomous report writer.\n\n## Mission\nCreate clear, actionable security reports from findings data.\n\n## Approach\n- Gather all findings and evidence\n- Assess severity using CVSS\n- Write clear reproduction steps\n- Suggest remediation\n- Format for platform submission\n\n## Personality\n- Precise and concise\n- Technical but accessible\n- Focus on impact`,
  custom: `# {{CODENAME}}\n\nYou are {{NAME}}, a specialized AI agent.\n\n## Role\n{{ROLE}}\n\n## Specialization\n{{SPEC}}\n\n## Mission\nDescribe the agent's primary objective here.\n\n## Approach\n- Step 1\n- Step 2\n- Step 3`,
};

// ─── Agent Card ──────────────────────────────────────────────────────────────

function AgentCard({ agent, onViewProfile, onAssignTask, onAssignPrograms, assignments, index }) {
  const codename = agent.codename || agent.name || agent.id;
  const initial = codename.charAt(0).toUpperCase();
  const isActive = agent.status === 'active';
  const programCount = assignments?.programs?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`rounded-lg border bg-[--card] transition-all hover:border-[--cyan]/20 ${
        isActive ? 'border-green-500/20 shadow-[0_0_15px_oklch(0.7_0.17_145/8%)]' : 'border-white/[0.06]'
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="shrink-0 w-12 h-12 rounded-lg bg-[--cyan]/10 border border-[--cyan]/20 flex items-center justify-center">
          <span className="text-xl font-mono font-bold text-[--cyan]">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-mono font-semibold text-foreground">@{codename.toUpperCase()}</p>
            <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 text-[9px] font-mono font-medium">
                {agent.activeJobs} job{agent.activeJobs !== 1 ? 's' : ''} running
              </span>
            )}
            {programCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 text-[9px] font-mono font-medium">
                <CrosshairIcon size={8} /> {programCount} program{programCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {agent.role && <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{agent.role}</p>}
          {agent.specialization && <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono truncate">{agent.specialization}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onViewProfile(agent.id)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] hover:border-[--cyan]/30 hover:text-[--cyan] transition-colors">
            View
          </button>
          <button onClick={() => onAssignPrograms(agent)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono font-medium border border-orange-500/20 text-orange-400 hover:bg-orange-500/10 transition-colors">
            <CrosshairIcon size={10} /> Programs
          </button>
          <button onClick={() => onAssignTask(agent)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors">
            Assign Task
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Agent Profile Panel ─────────────────────────────────────────────────────

function AgentProfilePanel({ agentId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAgentProfile(agentId).then((p) => { setProfile(p); setLoading(false); });
  }, [agentId]);

  async function handleSave() {
    if (!editingFile) return;
    setSaving(true);
    await updateAgentFile(agentId, editingFile, editContent);
    const updated = await getAgentProfile(agentId);
    setProfile(updated);
    setEditingFile(null);
    setSaving(false);
  }

  function startEdit(filename, content) {
    setEditingFile(filename);
    setEditContent(content || '');
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-lg border border-[--cyan]/20 bg-[--card] p-5">
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-shimmer rounded-md border border-white/[0.06]" />)}
        </div>
      </motion.div>
    );
  }

  if (!profile) return null;

  const codename = profile.codename || profile.name || profile.id;
  const files = [
    { name: 'SOUL.md', content: profile.soul, label: 'Soul' },
    { name: 'SKILLS.md', content: profile.skills, label: 'Skills' },
    { name: 'TOOLS.md', content: profile.tools, label: 'Tools' },
    { name: 'HEARTBEAT.md', content: profile.heartbeat, label: 'Heartbeat' },
    { name: 'IDENTITY.md', content: null, label: 'Identity' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      className="rounded-lg border border-[--cyan]/20 bg-[--card] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[--cyan]/10 border border-[--cyan]/20 flex items-center justify-center">
            <span className="text-lg font-mono font-bold text-[--cyan]">{codename.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-mono font-semibold">@{codename.toUpperCase()}</p>
            {profile.role && <p className="text-[10px] font-mono text-muted-foreground">{profile.role}</p>}
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><XIcon size={16} /></button>
      </div>

      <div className="p-4 border-b border-white/[0.06]">
        <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">Identity</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {profile.name && <div><span className="text-[10px] font-mono text-muted-foreground uppercase">Name</span><p className="text-xs font-mono">{profile.name}</p></div>}
          <div><span className="text-[10px] font-mono text-muted-foreground uppercase">Codename</span><p className="text-xs font-mono">{codename}</p></div>
          {profile.role && <div><span className="text-[10px] font-mono text-muted-foreground uppercase">Role</span><p className="text-xs font-mono">{profile.role}</p></div>}
          {profile.specialization && <div><span className="text-[10px] font-mono text-muted-foreground uppercase">Specialization</span><p className="text-xs font-mono">{profile.specialization}</p></div>}
        </div>
      </div>

      {profile.config && (
        <div className="p-4 border-b border-white/[0.06]">
          <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">Config</span>
          <pre className="mt-2 text-[11px] bg-black/30 rounded-md p-2.5 font-mono overflow-auto max-h-32 text-foreground/80 border border-white/[0.04] scrollbar-thin">
            {JSON.stringify(profile.config, null, 2)}
          </pre>
        </div>
      )}

      <div className="p-4">
        <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider">Files</span>
        <div className="flex flex-col gap-2 mt-2">
          {files.map((f) => (
            <div key={f.name}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">{f.name}</span>
                <div className="flex items-center gap-1">
                  {f.content ? <span className="text-[9px] font-mono text-green-500">exists</span> : <span className="text-[9px] font-mono text-muted-foreground/50">empty</span>}
                  <button onClick={() => editingFile === f.name ? setEditingFile(null) : startEdit(f.name, f.content)}
                    className="text-muted-foreground hover:text-[--cyan] transition-colors p-0.5"><PencilIcon size={10} /></button>
                </div>
              </div>
              <AnimatePresence>
                {editingFile === f.name && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={8}
                      className="w-full mt-1 text-[11px] border border-white/[0.06] rounded-md p-2.5 bg-black/20 font-mono text-foreground/80 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors resize-y" />
                    <div className="flex gap-2 mt-1">
                      <button onClick={handleSave} disabled={saving}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50">
                        {saving ? <SpinnerIcon size={10} /> : <CheckIcon size={10} />} Save
                      </button>
                      <button onClick={() => setEditingFile(null)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Assign Task Dialog ──────────────────────────────────────────────────────

function AssignTaskDialog({ agent, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit() {
    if (!prompt) return;
    setSubmitting(true);
    const res = await createAgentJob(agent.id, prompt);
    setResult(res);
    setSubmitting(false);
  }

  const codename = agent.codename || agent.name || agent.id;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg border border-[--cyan]/20 bg-[--card] shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ff5f57]" /><div className="w-2 h-2 rounded-full bg-[#febc2e]" /><div className="w-2 h-2 rounded-full bg-[#28c840]" /></div>
            <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider ml-1">Assign Task to @{codename.toUpperCase()}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XIcon size={14} /></button>
        </div>
        <div className="p-4">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the task for this agent..." rows={4}
            className="w-full text-sm border border-white/[0.06] rounded-md p-3 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors resize-y" autoFocus />
          {result && (
            <p className={`text-xs font-mono mt-2 ${result.error ? 'text-[--destructive]' : 'text-green-500'}`}>
              {result.error || 'Job created successfully'}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !prompt}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50">
              {submitting ? <SpinnerIcon size={12} /> : 'Create Job'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Program Assignment Wizard ───────────────────────────────────────────────

function ProgramAssignmentWizard({ agent, currentAssignments, onClose, onAssigned }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set(currentAssignments?.programs || []));
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('select'); // 'select' | 'review' | 'deepdive'
  const [deepDiveProgram, setDeepDiveProgram] = useState(null);
  const [deepDiveTargets, setDeepDiveTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'with-targets', 'bounty'

  useEffect(() => {
    getProgramsForAssignment().then(p => { setPrograms(p); setLoading(false); });
  }, []);

  const codename = agent.codename || agent.name || agent.id;

  function toggleProgram(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handleSave() {
    setSaving(true);
    const ids = [...selected];
    await assignProgramsToAgent(agent.id, ids);
    setSaving(false);
    onAssigned();
    onClose();
  }

  async function handleDeepDive(program) {
    setDeepDiveProgram(program);
    setStep('deepdive');
    setLoadingTargets(true);
    const targets = await getTargetsForPrograms([program.id]);
    setDeepDiveTargets(targets);
    setLoadingTargets(false);
  }

  async function handleRemoveProgram(programId) {
    await unassignProgramFromAgent(agent.id, programId);
    const next = new Set(selected);
    next.delete(programId);
    setSelected(next);
    onAssigned();
  }

  // Filter programs
  const filtered = programs.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.platform.toLowerCase().includes(q)) return false;
    }
    if (filter === 'with-targets' && p.targetCount === 0) return false;
    if (filter === 'bounty' && (!p.maxBounty || p.maxBounty === 0)) return false;
    return true;
  });

  // Sort: selected first, then by target count
  const sorted = [...filtered].sort((a, b) => {
    const aS = selected.has(a.id) ? 1 : 0;
    const bS = selected.has(b.id) ? 1 : 0;
    if (bS !== aS) return bS - aS;
    return b.targetCount - a.targetCount;
  });

  const selectedPrograms = programs.filter(p => selected.has(p.id));
  const totalTargets = selectedPrograms.reduce((sum, p) => sum + p.targetCount, 0);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-lg border border-orange-500/20 bg-[--card] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ff5f57]" /><div className="w-2 h-2 rounded-full bg-[#febc2e]" /><div className="w-2 h-2 rounded-full bg-[#28c840]" /></div>
            <span className="font-mono text-[10px] font-medium text-orange-400 uppercase tracking-wider ml-1">
              {step === 'deepdive'
                ? `Deep Dive — ${deepDiveProgram?.name}`
                : step === 'review'
                  ? `Review — @${codename.toUpperCase()}`
                  : `Assign Programs — @${codename.toUpperCase()}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {step !== 'select' && (
              <button onClick={() => setStep('select')}
                className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XIcon size={14} /></button>
          </div>
        </div>

        {/* Step: Select programs */}
        {step === 'select' && (
          <>
            {/* Selection summary bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-black/20 shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground">
                {selected.size} program{selected.size !== 1 ? 's' : ''} selected
              </span>
              <span className="text-[10px] font-mono text-orange-400">{totalTargets} targets</span>
              <div className="flex-1" />
              {/* Filters */}
              <div className="flex items-center gap-1">
                {['all', 'with-targets', 'bounty'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-2 py-0.5 text-[9px] font-mono rounded-full border transition-colors ${
                      filter === f
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : 'border-white/[0.06] text-muted-foreground hover:text-foreground'
                    }`}>
                    {f === 'all' ? 'All' : f === 'with-targets' ? 'Has Targets' : 'Bounty'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><SearchIcon size={14} /></div>
                <input placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full text-sm border border-white/[0.06] rounded-md pl-9 pr-3 py-2 bg-black/20 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-colors" autoFocus />
              </div>
            </div>

            {/* Program list */}
            <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
              {loading ? (
                <div className="flex flex-col gap-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-shimmer rounded-lg border border-white/[0.06]" />)}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {sorted.map(p => {
                    const isSelected = selected.has(p.id);
                    return (
                      <div key={p.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                        onClick={() => toggleProgram(p.id)}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-orange-500 border-orange-500' : 'border-white/[0.15]'
                        }`}>
                          {isSelected && <CheckIcon size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-mono font-medium truncate">{p.name}</p>
                            <span className="inline-flex items-center rounded-full bg-white/[0.04] px-1.5 py-0 text-[9px] font-mono text-muted-foreground border border-white/[0.06] shrink-0">
                              {p.platform}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[9px] font-mono text-muted-foreground">{p.targetCount} targets</span>
                            {p.inScopeCount > 0 && <span className="text-[9px] font-mono text-green-500">{p.inScopeCount} in scope</span>}
                            {p.maxBounty > 0 && <span className="text-[9px] font-mono text-yellow-500">${p.minBounty || 0}–${p.maxBounty}</span>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeepDive(p); }}
                          className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-orange-400 border border-white/[0.06] hover:border-orange-500/20 transition-colors"
                        >
                          <SearchIcon size={10} /> Deep Dive
                        </button>
                      </div>
                    );
                  })}
                  {sorted.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm font-mono text-muted-foreground">No programs found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] shrink-0 bg-black/20">
              <button onClick={() => setStep('review')} disabled={selected.size === 0}
                className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                Review Selection →
              </button>
              <div className="flex items-center gap-2">
                <button onClick={onClose}
                  className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground">Cancel</button>
                <button onClick={handleSave} disabled={saving || selected.size === 0}
                  className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-colors disabled:opacity-50">
                  {saving ? <SpinnerIcon size={12} /> : <CheckIcon size={12} />}
                  Assign {selected.size} Program{selected.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex flex-col items-center p-3 rounded-lg border border-orange-500/20 bg-[--card]">
                  <span className="text-xl font-semibold text-orange-400 font-mono">{selected.size}</span>
                  <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Programs</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg border border-orange-500/20 bg-[--card]">
                  <span className="text-xl font-semibold text-orange-400 font-mono">{totalTargets}</span>
                  <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Total Targets</span>
                </div>
              </div>

              <span className="font-mono text-[10px] font-medium text-orange-400 uppercase tracking-wider">Assigned Programs</span>
              <div className="flex flex-col gap-2 mt-2">
                {selectedPrograms.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-orange-500/10 bg-orange-500/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-medium">{p.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{p.platform}</span>
                        <span className="text-[10px] font-mono text-green-500">{p.targetCount} targets</span>
                        {p.maxBounty > 0 && <span className="text-[10px] font-mono text-yellow-500">${p.minBounty || 0}–${p.maxBounty}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeepDive(p)}
                      className="shrink-0 text-[10px] font-mono text-muted-foreground hover:text-orange-400 transition-colors">
                      Deep Dive
                    </button>
                    <button onClick={() => handleRemoveProgram(p.id)}
                      className="shrink-0 text-muted-foreground hover:text-[--destructive] transition-colors"><XIcon size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end px-4 py-3 border-t border-white/[0.06] shrink-0">
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-colors disabled:opacity-50">
                {saving ? <SpinnerIcon size={12} /> : <CheckIcon size={12} />} Save Assignments
              </button>
            </div>
          </>
        )}

        {/* Step: Deep Dive into a program's targets */}
        {step === 'deepdive' && deepDiveProgram && (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-black/20 shrink-0">
              <div className="flex-1">
                <p className="text-sm font-mono font-medium">{deepDiveProgram.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">{deepDiveProgram.platform}</span>
                  <span className="text-[10px] font-mono text-green-500">{deepDiveProgram.targetCount} targets ({deepDiveProgram.inScopeCount} in scope)</span>
                  {deepDiveProgram.maxBounty > 0 && <span className="text-[10px] font-mono text-yellow-500">${deepDiveProgram.minBounty || 0}–${deepDiveProgram.maxBounty}</span>}
                  {deepDiveProgram.url && <a href={deepDiveProgram.url} target="_blank" rel="noopener" className="text-[10px] font-mono text-[--cyan] hover:underline">View on Platform →</a>}
                </div>
              </div>
              {!selected.has(deepDiveProgram.id) ? (
                <button onClick={() => { toggleProgram(deepDiveProgram.id); }}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-mono font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-colors">
                  <PlusIcon size={12} /> Assign to Agent
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 text-[10px] font-mono">
                  <CheckIcon size={10} /> Assigned
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
              {loadingTargets ? (
                <div className="flex flex-col gap-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-10 animate-shimmer rounded-lg border border-white/[0.06]" />)}
                </div>
              ) : deepDiveTargets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-mono text-muted-foreground">No in-scope targets found for this program</p>
                </div>
              ) : (
                <>
                  {/* Type summary */}
                  {(() => {
                    const types = {};
                    deepDiveTargets.forEach(t => { types[t.type] = (types[t.type] || 0) + 1; });
                    return (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {Object.entries(types).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                          <span key={type} className="inline-flex items-center rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-mono border border-white/[0.06]">
                            {type} <span className="text-[--cyan] ml-1">{count}</span>
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="flex flex-col gap-1">
                    {deepDiveTargets.map((t, i) => (
                      <div key={t.id || i} className="flex items-center gap-2 p-2 rounded-md border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[8px] font-mono border shrink-0 ${
                          t.type === 'domain' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : t.type === 'wildcard' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : t.type === 'url' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : t.type === 'ip' || t.type === 'cidr' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            : 'bg-white/[0.04] text-muted-foreground border-white/[0.06]'
                        }`}>
                          {t.type}
                        </span>
                        <span className="text-xs font-mono text-foreground/90 flex-1 truncate">{t.value}</span>
                        {t.notes && <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0 truncate max-w-[120px]">{t.notes}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md border transition-colors ${
        active
          ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20'
          : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
      }`}>
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

// ─── Form Input Helpers ──────────────────────────────────────────────────────

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors";
const selectClass = "w-full text-sm border border-white/[0.06] rounded-md px-3 py-2 bg-black/20 font-mono focus:outline-none focus:border-[--cyan]/40 transition-colors";
const textareaClass = "w-full text-sm border border-white/[0.06] rounded-md p-3 bg-black/20 font-mono text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors resize-y";

// ─── Create Agent Form (Enhanced) ────────────────────────────────────────────

function CreateAgentForm({ onCreated, onClose }) {
  const [tab, setTab] = useState('basic');
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [result, setResult] = useState(null);
  const [mcpTools, setMcpTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(false);

  // Basic
  const [name, setName] = useState('');
  const [codename, setCodename] = useState('');
  const [role, setRole] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // LLM
  const [llmProvider, setLlmProvider] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);

  // Soul / Skills / Heartbeat
  const [soulTemplate, setSoulTemplate] = useState('custom');
  const [soul, setSoul] = useState('');
  const [skills, setSkills] = useState('');
  const [heartbeat, setHeartbeat] = useState('');

  // Tools
  const [selectedTools, setSelectedTools] = useState([]);

  // Scheduling
  const [runMode, setRunMode] = useState('manual');
  const [schedule, setSchedule] = useState('');
  const [maxConcurrent, setMaxConcurrent] = useState(1);
  const [timeout, setTimeout_] = useState(0);

  // Resources
  const [cpu, setCpu] = useState('1');
  const [memory, setMemory] = useState('1GB');
  const [disk, setDisk] = useState('5GB');
  const [network, setNetwork] = useState('full');

  // Filesystem
  const [workDir, setWorkDir] = useState('/workspace');
  const [allowedPaths, setAllowedPaths] = useState('');

  // Env vars
  const [envVars, setEnvVars] = useState([]);

  // Team
  const [swarm, setSwarm] = useState('');
  const [supervisor, setSupervisor] = useState('');

  // Auto-generate codename from name
  useEffect(() => {
    if (name && !codename) {
      setCodename(name.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_'));
    }
  }, [name]);

  // Load MCP tools on Tools tab
  useEffect(() => {
    if (tab === 'tools' && mcpTools.length === 0 && !loadingTools) {
      setLoadingTools(true);
      getAvailableMcpTools().then(t => { setMcpTools(t); setLoadingTools(false); }).catch(() => setLoadingTools(false));
    }
  }, [tab]);

  // Apply soul template
  function applySoulTemplate(templateKey) {
    setSoulTemplate(templateKey);
    let content = SOUL_TEMPLATES[templateKey] || SOUL_TEMPLATES.custom;
    content = content.replace(/\{\{CODENAME\}\}/g, codename || 'AGENT');
    content = content.replace(/\{\{NAME\}\}/g, name || 'Agent');
    content = content.replace(/\{\{ROLE\}\}/g, role || 'General Agent');
    content = content.replace(/\{\{SPEC\}\}/g, specialization || 'General');
    setSoul(content);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  function addEnvVar() {
    setEnvVars([...envVars, { key: '', value: '' }]);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const issues = [];
    if (!name && !codename) issues.push('Name or codename is required');
    if (llmProvider && !llmModel) issues.push('LLM model not selected');
    if (runMode === 'scheduled' && !schedule) issues.push('Schedule expression is required for scheduled mode');
    setTestResult(issues.length === 0 ? { success: true } : { issues });
    setTesting(false);
  }

  async function handleCreate() {
    if (!name && !codename) return;
    setCreating(true);
    const identity = {
      name, codename, role, specialization, description, goal, tags,
      soul: soul || undefined,
      skills: skills || undefined,
      heartbeat: heartbeat || undefined,
      llm: llmProvider ? { provider: llmProvider, model: llmModel, temperature, maxTokens } : undefined,
      scheduling: runMode !== 'manual' ? { mode: runMode, schedule, maxConcurrent, timeout: timeout || undefined } : undefined,
      resources: { cpu, memory, disk, network },
      mcpTools: selectedTools.length > 0 ? selectedTools : undefined,
      envVars: envVars.reduce((acc, v) => { if (v.key) acc[v.key] = v.value; return acc; }, {}),
      team: (swarm || supervisor) ? { swarm: swarm || undefined, supervisor: supervisor || undefined } : undefined,
    };
    const res = await createAgent(identity);
    setResult(res);
    if (!res.error) onCreated();
    setCreating(false);
  }

  const TABS = [
    { id: 'basic', label: 'Basic', icon: UsersIcon },
    { id: 'llm', label: 'LLM', icon: CpuIcon },
    { id: 'soul', label: 'Soul', icon: PencilIcon },
    { id: 'tools', label: 'Tools', icon: PackageIcon },
    { id: 'schedule', label: 'Schedule', icon: ClockIcon },
    { id: 'resources', label: 'Resources', icon: SlidersIcon },
    { id: 'files', label: 'Files', icon: FolderIcon },
    { id: 'env', label: 'Env', icon: HashIcon },
    { id: 'team', label: 'Team', icon: UsersIcon },
  ];

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="rounded-lg border border-[--cyan]/20 bg-[--card] mt-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ff5f57]" /><div className="w-2 h-2 rounded-full bg-[#febc2e]" /><div className="w-2 h-2 rounded-full bg-[#28c840]" /></div>
            <span className="font-mono text-[10px] font-medium text-[--cyan] uppercase tracking-wider ml-1">Create New Agent</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XIcon size={14} /></button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 p-4 pb-0 overflow-x-auto scrollbar-thin">
          {TABS.map(t => <TabBtn key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />)}
        </div>

        <div className="p-4">
          {/* ── Basic Tab ──────────────────────────────────────────────────── */}
          {tab === 'basic' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Name">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Reaper" className={inputClass} />
                </FormField>
                <FormField label="Codename (auto-generated)">
                  <input value={codename} onChange={e => setCodename(e.target.value)} placeholder="REAPER" className={inputClass} />
                </FormField>
                <FormField label="Role">
                  <select value={role} onChange={e => setRole(e.target.value)} className={selectClass}>
                    <option value="">Select role...</option>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </FormField>
                <FormField label="Specialization">
                  <select value={specialization} onChange={e => setSpecialization(e.target.value)} className={selectClass}>
                    <option value="">Select specialization...</option>
                    {SPEC_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label="Description">
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief purpose statement" className={inputClass} />
              </FormField>
              <FormField label="Goal">
                <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Specific mission objective..." rows={2} className={textareaClass} />
              </FormField>
              <FormField label="Tags">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 px-2 py-0.5 text-[10px] font-mono">
                      {t}
                      <button onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-[--destructive]"><XIcon size={8} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..." className={inputClass} />
                  <button onClick={addTag} className="shrink-0 inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <PlusIcon size={12} />
                  </button>
                </div>
              </FormField>
            </div>
          )}

          {/* ── LLM Tab ────────────────────────────────────────────────────── */}
          {tab === 'llm' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Provider">
                  <select value={llmProvider} onChange={e => { setLlmProvider(e.target.value); setLlmModel(''); }} className={selectClass}>
                    <option value="">Default (inherit)</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                    <option value="google">Google</option>
                    <option value="custom">Custom</option>
                  </select>
                </FormField>
                <FormField label="Model">
                  <select value={llmModel} onChange={e => setLlmModel(e.target.value)} className={selectClass} disabled={!llmProvider}>
                    <option value="">Select model...</option>
                    {(PROVIDER_MODELS[llmProvider] || []).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {llmProvider === 'custom' && (
                    <input value={llmModel} onChange={e => setLlmModel(e.target.value)} placeholder="model-name" className={`${inputClass} mt-2`} />
                  )}
                </FormField>
              </div>
              <FormField label={`Temperature: ${temperature}`}>
                <input type="range" min="0" max="1" step="0.05" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[--cyan]" />
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
                  <span>Precise (0)</span><span>Creative (1)</span>
                </div>
              </FormField>
              <FormField label="Max Tokens">
                <div className="flex items-center gap-2">
                  <input type="number" value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value) || 4096)} className={inputClass} />
                  <div className="flex gap-1">
                    {[4096, 8192, 16384].map(v => (
                      <button key={v} onClick={() => setMaxTokens(v)}
                        className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${maxTokens === v ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20' : 'border-white/[0.06] text-muted-foreground hover:text-foreground'}`}>
                        {v >= 1000 ? `${v/1000}k` : v}
                      </button>
                    ))}
                  </div>
                </div>
              </FormField>
            </div>
          )}

          {/* ── Soul Tab ───────────────────────────────────────────────────── */}
          {tab === 'soul' && (
            <div className="flex flex-col gap-4">
              <FormField label="Template">
                <div className="flex gap-2 mb-2">
                  {Object.entries({ recon: 'Recon Agent', exploit: 'Exploit Dev', report: 'Report Writer', custom: 'Custom' }).map(([k, label]) => (
                    <button key={k} onClick={() => applySoulTemplate(k)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
                        soulTemplate === k ? 'bg-[--cyan]/10 text-[--cyan] border-[--cyan]/20' : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                      }`}>{label}</button>
                  ))}
                </div>
              </FormField>
              <FormField label="SOUL.md">
                <textarea value={soul} onChange={e => setSoul(e.target.value)} rows={10} placeholder="Agent personality and system prompt..."
                  className={textareaClass} />
              </FormField>
              <FormField label="SKILLS.md (optional)">
                <textarea value={skills} onChange={e => setSkills(e.target.value)} rows={4} placeholder="Define agent skills and capabilities..."
                  className={textareaClass} />
              </FormField>
              <FormField label="HEARTBEAT.md (optional)">
                <textarea value={heartbeat} onChange={e => setHeartbeat(e.target.value)} rows={3} placeholder="Self-monitoring behavior..."
                  className={textareaClass} />
              </FormField>
            </div>
          )}

          {/* ── Tools Tab ──────────────────────────────────────────────────── */}
          {tab === 'tools' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-mono text-muted-foreground">Select MCP tools this agent can use.</p>
              {loadingTools ? (
                <div className="flex items-center gap-2 py-4"><SpinnerIcon size={14} /><span className="text-xs font-mono text-muted-foreground">Loading tools...</span></div>
              ) : mcpTools.length === 0 ? (
                <div className="text-xs font-mono text-muted-foreground py-4">No MCP tools configured. Add tools in Settings &gt; MCP.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {mcpTools.map(tool => {
                    const checked = selectedTools.includes(tool.name);
                    return (
                      <label key={tool.name}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          checked ? 'border-[--cyan]/30 bg-[--cyan]/5' : 'border-white/[0.06] bg-[--card] hover:border-white/[0.12]'
                        }`}>
                        <input type="checkbox" checked={checked}
                          onChange={e => setSelectedTools(e.target.checked ? [...selectedTools, tool.name] : selectedTools.filter(t => t !== tool.name))}
                          className="mt-0.5 accent-[--cyan]" />
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-medium truncate">{tool.name}</p>
                          {tool.description && <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">{tool.description}</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {selectedTools.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground">Selected:</span>
                  {selectedTools.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 px-2 py-0.5 text-[9px] font-mono">
                      {t}<button onClick={() => setSelectedTools(selectedTools.filter(x => x !== t))}><XIcon size={8} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Schedule Tab ───────────────────────────────────────────────── */}
          {tab === 'schedule' && (
            <div className="flex flex-col gap-4">
              <FormField label="Run Mode">
                <select value={runMode} onChange={e => setRunMode(e.target.value)} className={selectClass}>
                  {RUN_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FormField>
              {runMode === 'scheduled' && (
                <FormField label="Cron Schedule">
                  <input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="0 */6 * * *" className={inputClass} />
                  <p className="text-[9px] font-mono text-muted-foreground mt-1">Standard cron expression (min hour dom month dow)</p>
                </FormField>
              )}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Max Concurrent Jobs">
                  <select value={maxConcurrent} onChange={e => setMaxConcurrent(parseInt(e.target.value))} className={selectClass}>
                    {[1, 2, 5, 10].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label="Timeout (seconds, 0=none)">
                  <input type="number" value={timeout} onChange={e => setTimeout_(parseInt(e.target.value) || 0)} className={inputClass} min="0" />
                </FormField>
              </div>
            </div>
          )}

          {/* ── Resources Tab ──────────────────────────────────────────────── */}
          {tab === 'resources' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="CPU Cores">
                  <select value={cpu} onChange={e => setCpu(e.target.value)} className={selectClass}>
                    {['0.5', '1', '2', '4'].map(v => <option key={v} value={v}>{v} core{v !== '1' ? 's' : ''}</option>)}
                  </select>
                </FormField>
                <FormField label="Memory">
                  <select value={memory} onChange={e => setMemory(e.target.value)} className={selectClass}>
                    {['512MB', '1GB', '2GB', '4GB', '8GB'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label="Disk">
                  <select value={disk} onChange={e => setDisk(e.target.value)} className={selectClass}>
                    {['1GB', '5GB', '10GB', 'Unlimited'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label="Network">
                  <select value={network} onChange={e => setNetwork(e.target.value)} className={selectClass}>
                    <option value="isolated">Isolated</option>
                    <option value="internal">Internal only</option>
                    <option value="full">Full internet</option>
                  </select>
                </FormField>
              </div>
            </div>
          )}

          {/* ── Files Tab ──────────────────────────────────────────────────── */}
          {tab === 'files' && (
            <div className="flex flex-col gap-4">
              <FormField label="Working Directory">
                <input value={workDir} onChange={e => setWorkDir(e.target.value)} className={inputClass} />
              </FormField>
              <FormField label="Allowed Paths (comma-separated)">
                <input value={allowedPaths} onChange={e => setAllowedPaths(e.target.value)} placeholder="/workspace, /tmp" className={inputClass} />
              </FormField>
            </div>
          )}

          {/* ── Env Tab ────────────────────────────────────────────────────── */}
          {tab === 'env' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-mono text-muted-foreground">Agent-specific environment variables.</p>
              {envVars.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input value={v.key} onChange={e => { const nv = [...envVars]; nv[i] = { ...nv[i], key: e.target.value }; setEnvVars(nv); }}
                    placeholder="KEY" className={inputClass} />
                  <input value={v.value} onChange={e => { const nv = [...envVars]; nv[i] = { ...nv[i], value: e.target.value }; setEnvVars(nv); }}
                    placeholder="value" className={inputClass} />
                  <button onClick={() => setEnvVars(envVars.filter((_, j) => j !== i))}
                    className="shrink-0 p-2 text-muted-foreground hover:text-[--destructive] transition-colors"><TrashIcon size={12} /></button>
                </div>
              ))}
              <button onClick={addEnvVar}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium border border-dashed border-white/[0.12] hover:bg-white/[0.04] transition-colors text-muted-foreground hover:text-foreground self-start">
                <PlusIcon size={12} /> Add Variable
              </button>
            </div>
          )}

          {/* ── Team Tab ───────────────────────────────────────────────────── */}
          {tab === 'team' && (
            <div className="flex flex-col gap-4">
              <FormField label="Part of Swarm">
                <select value={swarm} onChange={e => setSwarm(e.target.value)} className={selectClass}>
                  <option value="">None</option>
                  <option value="recon-team">Recon Team</option>
                  <option value="exploit-team">Exploit Team</option>
                  <option value="full-swarm">Full Swarm</option>
                </select>
              </FormField>
              <FormField label="Supervisor Agent">
                <input value={supervisor} onChange={e => setSupervisor(e.target.value)} placeholder="@OVERSEER" className={inputClass} />
              </FormField>
            </div>
          )}

          {/* ── Actions ────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
            <button onClick={handleCreate} disabled={creating || (!name && !codename)}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors disabled:opacity-50">
              {creating ? <SpinnerIcon size={12} /> : <PlusIcon size={12} />} Create Agent
            </button>
            <button onClick={handleTest} disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50">
              {testing ? <SpinnerIcon size={12} /> : <PlayIcon size={12} />} Validate
            </button>
            <button onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-mono font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-muted-foreground">
              Cancel
            </button>
            {result && (
              <p className={`text-xs font-mono ml-2 ${result.error ? 'text-[--destructive]' : 'text-green-500'}`}>
                {result.error || `Agent created: ${result.id}`}
              </p>
            )}
            {testResult && (
              <p className={`text-xs font-mono ml-2 ${testResult.success ? 'text-green-500' : 'text-yellow-500'}`}>
                {testResult.success ? 'Configuration valid' : testResult.issues?.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [assigningTask, setAssigningTask] = useState(null);
  const [assigningPrograms, setAssigningPrograms] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [allAssignments, setAllAssignments] = useState({});
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'orgchart'
  const [workspaceAgent, setWorkspaceAgent] = useState(null);

  async function load() {
    try {
      const [a, assignments] = await Promise.all([
        getAgentProfilesWithStatus(),
        getAllAgentAssignments(),
      ]);
      setAgents(a);
      setAllAssignments(assignments || {});
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  async function refreshAssignments() {
    try {
      const assignments = await getAllAgentAssignments();
      setAllAssignments(assignments || {});
    } catch {}
  }

  useEffect(() => { load(); }, []);

  const activeCount = agents.filter(a => a.status === 'active').length;

  const filtered = agents.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    const codename = (a.codename || a.name || a.id || '').toLowerCase();
    const role = (a.role || '').toLowerCase();
    return codename.includes(q) || role.includes(q);
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-white/[0.04] border border-white/[0.06]" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono font-semibold text-[--cyan] text-glow-cyan">Agents</h1>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">Manage agent profiles, roles, and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20">{agents.length} agents</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-mono font-medium bg-green-500/10 text-green-500 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{activeCount} active
            </span>
          )}
          <div className="inline-flex rounded-md border border-white/[0.06] overflow-hidden">
            <button onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 text-[10px] font-mono font-medium transition-colors ${viewMode === 'cards' ? 'bg-[--cyan]/10 text-[--cyan]' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}>
              <UsersIcon size={12} />
            </button>
            <button onClick={() => setViewMode('orgchart')}
              className={`px-2.5 py-1.5 text-[10px] font-mono font-medium transition-colors border-l border-white/[0.06] ${viewMode === 'orgchart' ? 'bg-[--cyan]/10 text-[--cyan]' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}>
              <NetworkIcon size={12} />
            </button>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium bg-[--cyan]/10 text-[--cyan] border border-[--cyan]/20 hover:bg-[--cyan] hover:text-[--primary-foreground] transition-colors">
            <PlusIcon size={12} /> New Agent
          </button>
          <button onClick={() => { setRefreshing(true); load(); }} disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium border border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] disabled:opacity-50 transition-colors">
            {refreshing ? <SpinnerIcon size={14} /> : <RefreshIcon size={14} />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/[0.06] bg-[--card]">
          <span className="text-2xl font-semibold text-[--cyan] font-mono">{agents.length}</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Agents</span>
        </div>
        <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/[0.06] bg-[--card]">
          <span className="text-2xl font-semibold text-green-500 font-mono">{activeCount}</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Active</span>
        </div>
        <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/[0.06] bg-[--card]">
          <span className="text-2xl font-semibold font-mono text-muted-foreground">{agents.length - activeCount}</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Idle</span>
        </div>
      </div>

      {/* Search */}
      {agents.length > 0 && (
        <div className="relative mb-4">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><SearchIcon size={14} /></div>
          <input placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full text-sm border border-white/[0.06] rounded-md pl-9 pr-3 py-2 bg-black/20 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[--cyan]/40 focus:ring-1 focus:ring-[--cyan]/20 transition-colors" />
        </div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {showCreate && <CreateAgentForm onCreated={() => { load(); setShowCreate(false); }} onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      {/* Agent list — Cards view */}
      {viewMode === 'cards' && (
        <div className="flex flex-col gap-3 mt-4">
          {filtered.length === 0 && agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-white/[0.06] bg-[--card]">
              <div className="rounded-full bg-[--cyan]/10 p-4 mb-4"><UsersIcon size={24} className="text-[--cyan]" /></div>
              <p className="text-sm font-mono font-medium mb-1">No agents configured</p>
              <p className="text-[11px] text-muted-foreground font-mono max-w-sm">
                Create agent profiles in the <span className="text-[--cyan]">agents/</span> directory or click &ldquo;New Agent&rdquo; above.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-4"><SearchIcon size={24} /></div>
              <p className="text-sm font-mono text-muted-foreground">No agents match your search.</p>
            </div>
          ) : (
            filtered.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent}
                onViewProfile={setViewingProfile} onAssignTask={setAssigningTask}
                onAssignPrograms={setAssigningPrograms} assignments={allAssignments[agent.id]}
                onOpenWorkspace={(a) => setWorkspaceAgent(a)}
                index={i} />
            ))
          )}
        </div>
      )}

      {/* Agent list — Org chart view */}
      {viewMode === 'orgchart' && (
        <div className="mt-4">
          <OrgChartView agents={agents} onSelect={(agent) => { if (agent) setViewingProfile(agent.id); }} />
        </div>
      )}

      {/* Profile panel */}
      <AnimatePresence>
        {viewingProfile && (
          <div className="mt-4"><AgentProfilePanel agentId={viewingProfile} onClose={() => setViewingProfile(null)} /></div>
        )}
      </AnimatePresence>

      {/* Assign task dialog */}
      <AnimatePresence>
        {assigningTask && <AssignTaskDialog agent={assigningTask} onClose={() => setAssigningTask(null)} />}
      </AnimatePresence>

      {/* Program assignment wizard */}
      <AnimatePresence>
        {assigningPrograms && (
          <ProgramAssignmentWizard
            agent={assigningPrograms}
            currentAssignments={allAssignments[assigningPrograms.id]}
            onClose={() => setAssigningPrograms(null)}
            onAssigned={refreshAssignments}
          />
        )}
      </AnimatePresence>

      {/* Agent workspace browser */}
      <AgentWorkspace
        agentId={workspaceAgent?.id}
        agentName={workspaceAgent?.codename || workspaceAgent?.name || workspaceAgent?.id}
        open={!!workspaceAgent}
        onClose={() => setWorkspaceAgent(null)}
      />
    </>
  );
}
