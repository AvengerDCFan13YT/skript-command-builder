import React, { useMemo, useState, useEffect } from "react";

const ARG_TYPES = [
  { id: "string", label: "string" },
  { id: "number", label: "number" },
  { id: "integer", label: "integer" },
  { id: "player", label: "player" },
  { id: "itemtype", label: "itemtype" },
  { id: "location", label: "location" },
  { id: "timespan", label: "timespan" },
  { id: "boolean", label: "boolean" },
];

const SCB_CSS = `
:root {
  --bg:#f0f2f5;
  --card:#ffffff;
  --text:#1f2937;
  --muted:#6b7280;
  --primary:#3b82f6;
  --accent:#6366f1;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin:0; font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }
.app { min-height: 100vh; padding: 32px; display: flex; justify-content: center; align-items: flex-start; }
.container { max-width: 1024px; width:100%; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.card { background: var(--card); border-radius: 16px; padding:24px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
.input, .select, .textarea { width:100%; padding:10px; border:1px solid #d1d5db; border-radius: 12px; font-size:14px; }
.textarea { min-height: 80px; resize: vertical; }
.btn { padding: 8px 16px; margin:4px 2px; cursor:pointer; border-radius:12px; border:none; font-weight:500; transition: all 0.2s; }
.btn.primary { background: var(--primary); color:#fff; }
.btn.primary:hover { background: var(--accent); }
.btn.secondary { background:#e5e7eb; color:#111827; }
.label { font-size: 13px; margin-top: 8px; margin-bottom:4px; display:block; font-weight:500; }
.code { background:#111827; color:#f3f4f6; padding:16px; border-radius:12px; font-family: 'Fira Code', monospace; overflow-x:auto; max-height: 400px; }
.checkbox { margin-right:6px; }
h1 { grid-column: span 2; font-size: 24px; margin-bottom: 16px; }
h3 { margin-bottom:8px; font-size:18px; }
`;

function useInjectStyles(cssText) {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = cssText;
    document.head.appendChild(style);
  }, [cssText]);
}

function sanitizeName(name) {
  return name.trim().replace(/^\//, '');
}

function buildUsage(name, args) {
  const head = `/${sanitizeName(name)}`;
  const parts = args.map(a => a.optional ? `[<${a.name || a.type}>]` : `<${a.name || a.type}>`);
  return [head, ...parts].join(' ');
}

function buildCommandLine(name, args) {
  const head = `command /${sanitizeName(name)}`;
  const parts = args.map(a => a.optional ? `[<${a.name || a.type}>]` : `<${a.name || a.type}>`);
  return parts.length ? `${head} ${parts.join(' ')}:` : `${head}:`;
}

export default function SkriptCommandTemplateBuilder() {
  useInjectStyles(SCB_CSS);

  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");
  const [description, setDescription] = useState("");
  const [permission, setPermission] = useState("");
  const [permissionMessage, setPermissionMessage] = useState("");
  const [cooldownEnabled, setCooldownEnabled] = useState(false);
  const [cooldownValue, setCooldownValue] = useState("");
  const [cooldownMessage, setCooldownMessage] = useState("");
  const [cooldownBypass, setCooldownBypass] = useState("");
  const [executableBy, setExecutableBy] = useState("both");
  const [autoUsage, setAutoUsage] = useState(true);
  const [args, setArgs] = useState([{ name: "", type: "string", optional: false }]);

  const usageComputed = useMemo(() => autoUsage ? buildUsage(name, args) : "", [autoUsage, name, args]);

  const commandBlock = useMemo(() => {
    const lines = [];
    lines.push(buildCommandLine(name, args));
    if (aliases) lines.push(`aliases: ${aliases}`);
    if (description) lines.push(`description: ${description}`);
    if (usageComputed) lines.push(`usage: ${usageComputed}`);
    if (permission) lines.push(`permission: ${permission}`);
    if (permissionMessage) lines.push(`permission message: ${permissionMessage}`);
    if (executableBy !== "both") lines.push(`executable by: ${executableBy}`);
    if (cooldownEnabled && cooldownValue) {
      lines.push(`cooldown: ${cooldownValue}`);
      if (cooldownMessage) lines.push(`cooldown message: ${cooldownMessage}`);
      if (cooldownBypass) lines.push(`cooldown bypass: ${cooldownBypass}`);
    }
    args.forEach((a,i)=>{
      const nm = a.name || a.type || `arg${i+1}`;
      lines.push(`# <${nm}> -> ${a.type}${a.optional?' (optional)':''}`);
    });
    lines.push('trigger:');
    return lines.join('\n');
  }, [name, aliases, description, usageComputed, permission, permissionMessage, executableBy, cooldownEnabled, cooldownValue, cooldownMessage, cooldownBypass, args]);

  const addArg = () => setArgs(prev => [...prev, { name: "", type: "string", optional:false }]);
  const removeArg = idx => setArgs(prev => prev.filter((_, i) => i !== idx));
  const updateArg = (idx, patch) => setArgs(prev => prev.map((a,i)=>i===idx?{...a,...patch}:a));

  return (
    <div className="app">
      <div className="container">
        <h1>Skript Command Template Builder</h1>

        <div className="card">
          <label className="label">Command name</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Command name" />

          <label className="label">Aliases (comma-separated)</label>
          <input className="input" value={aliases} onChange={e=>setAliases(e.target.value)} placeholder="h, restore" />

          <label className="label">Description</label>
          <textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Command description" />

          <label className="label">Permission</label>
          <input className="input" value={permission} onChange={e=>setPermission(e.target.value)} placeholder="myplugin.permission" />

          <label className="label">Permission message</label>
          <input className="input" value={permissionMessage} onChange={e=>setPermissionMessage(e.target.value)} placeholder="§cNo permission" />

          <label className="label">Executable by</label>
          <select className="select" value={executableBy} onChange={e=>setExecutableBy(e.target.value)}>
            <option value="both">Players & Console</option>
            <option value="players">Players</option>
            <option value="console">Console</option>
          </select>

          <label className="label"><input type="checkbox" className="checkbox" checked={cooldownEnabled} onChange={e=>setCooldownEnabled(e.target.checked)} /> Enable cooldown</label>
          {cooldownEnabled && <>
            <input className="input" value={cooldownValue} onChange={e=>setCooldownValue(e.target.value)} placeholder="10 seconds" />
            <input className="input" value={cooldownMessage} onChange={e=>setCooldownMessage(e.target.value)} placeholder="Cooldown message" />
            <input className="input" value={cooldownBypass} onChange={e=>setCooldownBypass(e.target.value)} placeholder="Cooldown bypass permission" />
          </>}
        </div>

        <div className="card">
          <h3>Arguments</h3>
          {args.map((arg, idx) => (
            <div key={idx} style={{display:'flex', gap:8, marginTop:8}}>
              <input className="input" placeholder="name" value={arg.name} onChange={e=>updateArg(idx,{name:e.target.value})} />
              <select className="select" value={arg.type} onChange={e=>updateArg(idx,{type:e.target.value})}>
                {ARG_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <label><input type="checkbox" className="checkbox" checked={arg.optional} onChange={e=>updateArg(idx,{optional:e.target.checked})} /> optional</label>
              <button className="btn secondary" onClick={()=>removeArg(idx)}>✖</button>
            </div>
          ))}
          <button className="btn primary" onClick={addArg}>Add Arg</button>
        </div>

        <div className="card" style={{gridColumn: 'span 2'}}>
          <label className="label">Preview (before trigger:)</label>
          <pre className="code">{commandBlock || '# Your command block will appear here'}</pre>
        </div>
      </div>
    </div>
  );
}
