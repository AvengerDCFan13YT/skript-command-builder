import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Download, Plus, Trash2, Wand2, Info } from "lucide-react";

// shadcn/ui primitives (assumed available)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Types ---
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

function sanitizeName(name) {
  const trimmed = name.trim();
  if (!trimmed) return "";
  // Remove leading slash if present; Skript will add in usage if needed
  return trimmed.replace(/^\//, "");
}

function buildUsage(name, args) {
  const head = `/${sanitizeName(name)}`;
  const parts = args.map(a => {
    const token = a.name.trim() || a.type || "arg";
    const t = `<${token}>`;
    return a.optional ? `[${t.slice(1, -1)}]` : t;
  });
  return [head, ...parts].join(" ");
}

function buildCommandLine(name, args) {
  const head = `command /${sanitizeName(name)}`;
  const parts = args.map(a => {
    const token = a.name.trim() || a.type || "arg";
    return a.optional ? `[<${token}>]` : `<${token}>`;
  });
  return parts.length ? `${head} ${parts.join(" ")}:` : `${head}:`;
}

function buildAliases(aliasesRaw) {
  const list = aliasesRaw
    .split(",")
    .map(a => a.trim())
    .filter(Boolean)
    .map(a => (a.startsWith("/") ? a : `/${a}`));
  return list.join(", ");
}

function line(k, v) {
  return v ? `    ${k}: ${v}` : "";
}

export default function SkriptCommandTemplateBuilder() {
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [permission, setPermission] = useState("");
  const [permissionMessage, setPermissionMessage] = useState("");
  const [cooldownEnabled, setCooldownEnabled] = useState(false);
  const [cooldownValue, setCooldownValue] = useState("10 seconds");
  const [cooldownMessage, setCooldownMessage] = useState("");
  const [cooldownBypass, setCooldownBypass] = useState("");
  const [executableBy, setExecutableBy] = useState("both");
  const [autoUsage, setAutoUsage] = useState(true);
  const [args, setArgs] = useState([
    { name: "", type: "string", optional: false, greedy: false },
  ]);

  const usageComputed = useMemo(() => {
    return autoUsage ? buildUsage(name, args) : usage;
  }, [autoUsage, name, args, usage]);

  const commandBlock = useMemo(() => {
    const _aliases = buildAliases(aliases);
    const lines = [];
    // command header
    lines.push(buildCommandLine(name, args));

    if (_aliases) lines.push(line("aliases", _aliases));
    if (description.trim()) lines.push(line("description", description.trim()));
    if (usageComputed.trim()) lines.push(line("usage", usageComputed.trim()));
    if (permission.trim()) lines.push(line("permission", permission.trim()));
    if (permissionMessage.trim())
      lines.push(line("permission message", permissionMessage.trim()));

    // executable by
    if (executableBy !== "both") {
      lines.push(line("executable by", executableBy === "players" ? "players" : "console"));
    }

    // cooldowns
    if (cooldownEnabled && cooldownValue.trim()) {
      lines.push(line("cooldown", cooldownValue.trim()));
      if (cooldownMessage.trim()) lines.push(line("cooldown message", cooldownMessage.trim()));
      if (cooldownBypass.trim()) lines.push(line("cooldown bypass", cooldownBypass.trim()));
    }

    // argument parsing hints (comments)
    if (args.length) {
      const argHints = args
        .map((a, i) => {
          const nm = a.name.trim() || a.type || `arg${i + 1}`;
          const base = `${nm}: ${a.type}`;
          const extras = [a.optional ? "optional" : null, a.greedy ? "greedy" : null]
            .filter(Boolean)
            .join(", ");
          return `# <${nm}> -> ${base}${extras ? ` (${extras})` : ""}`;
        })
        .join("\n");
      if (argHints) lines.push(argHints);
    }

    return lines.join("\n");
  }, [name, args, aliases, description, usageComputed, permission, permissionMessage, executableBy, cooldownEnabled, cooldownValue, cooldownMessage, cooldownBypass]);

  const canCopy = commandBlock.trim().length > 0 && name.trim().length > 0;

  const addArg = () => setArgs(prev => [...prev, { name: "", type: "string", optional: false, greedy: false }]);
  const removeArg = (idx) => setArgs(prev => prev.filter((_, i) => i !== idx));
  const updateArg = (idx, patch) => setArgs(prev => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));

  const copyToClipboard = async () => {
    if (!canCopy) return;
    await navigator.clipboard.writeText(commandBlock);
  };

  const downloadFile = () => {
    const blob = new Blob([commandBlock + "\n"], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${sanitizeName(name) || "command"}.sk`; // Skript file
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const autofillDemo = () => {
    setName("heal");
    setAliases("h, restore");
    setDescription("Heals a target player by a specified amount.");
    setPermission("myplugin.heal");
    setPermissionMessage("§cYou lack §emyplugin.heal§c.");
    setCooldownEnabled(true);
    setCooldownValue("5 seconds");
    setCooldownMessage("§7Cooldown: §e%cooldown% remaining.");
    setCooldownBypass("myplugin.bypass.cooldown");
    setExecutableBy("players");
    setAutoUsage(true);
    setArgs([
      { name: "target", type: "player", optional: true, greedy: false },
      { name: "amount", type: "number", optional: true, greedy: false },
    ]);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white p-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Skript Command Template Builder</h1>
              <p className="text-slate-600">Design everything <span className="font-semibold">before the <code>trigger:</code></span>—clean, copyable, and ready.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={autofillDemo}>
                <Wand2 className="mr-2 h-4 w-4" /> Demo
              </Button>
              <Button onClick={copyToClipboard} disabled={!canCopy}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
              <Button onClick={downloadFile} disabled={!canCopy}>
                <Download className="mr-2 h-4 w-4" /> Download .sk
              </Button>
            </div>
          </motion.header>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Command Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Command name</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">/</span>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-6" placeholder="heal" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="aliases">Aliases (comma-separated)</Label>
                  <Input id="aliases" value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="h, restore" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="permission">Permission</Label>
                  <Input id="permission" value={permission} onChange={(e) => setPermission(e.target.value)} placeholder="myplugin.heal" />
                </div>
                <div>
                  <Label htmlFor="bypass">Cooldown bypass (perm)</Label>
                  <Input id="bypass" value={cooldownBypass} onChange={(e) => setCooldownBypass(e.target.value)} placeholder="myplugin.bypass.cooldown" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="permissionMessage">Permission message</Label>
                  <Input id="permissionMessage" value={permissionMessage} onChange={(e) => setPermissionMessage(e.target.value)} placeholder="§cYou lack §emyplugin.heal§c." />
                </div>
                <div>
                  <Label htmlFor="execby">Executable by</Label>
                  <Select value={executableBy} onValueChange={setExecutableBy}>
                    <SelectTrigger id="execby"><SelectValue placeholder="both"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">players & console</SelectItem>
                      <SelectItem value="players">players</SelectItem>
                      <SelectItem value="console">console</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Heals a target player by a specified amount." />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-3">
                  <Switch id="cooldown" checked={cooldownEnabled} onCheckedChange={setCooldownEnabled} />
                  <Label htmlFor="cooldown" className="cursor-pointer">Cooldown</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto md:ml-6">
                  <Input disabled={!cooldownEnabled} value={cooldownValue} onChange={(e) => setCooldownValue(e.target.value)} placeholder="10 seconds" />
                  <Input disabled={!cooldownEnabled} value={cooldownMessage} onChange={(e) => setCooldownMessage(e.target.value)} placeholder="§7Cooldown: §e%cooldown% remaining." />
                  <div className="flex items-center text-slate-500 text-sm md:justify-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Example formats: "5 seconds", "1 minute", "2 minutes and 10 seconds"
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Label>Arguments</Label>
                    <span className="text-xs text-slate-500">(controls usage line & comments)</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={addArg}>
                    <Plus className="mr-2 h-4 w-4" /> Add arg
                  </Button>
                </div>

                <div className="space-y-3">
                  {args.map((arg, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                      <Input
                        className="md:col-span-2"
                        placeholder={`name (e.g. target)`}
                        value={arg.name}
                        onChange={e => updateArg(idx, { name: e.target.value })}
                      />
                      <Select value={arg.type} onValueChange={(v) => updateArg(idx, { type: v })}>
                        <SelectTrigger className="md:col-span-2"><SelectValue placeholder="type"/></SelectTrigger>
                        <SelectContent>
                          {ARG_TYPES.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-3 md:col-span-2">
                        <div className="flex items-center gap-2">
                          <Switch checked={arg.optional} onCheckedChange={(v) => updateArg(idx, { optional: v })} id={`opt-${idx}`} />
                          <Label htmlFor={`opt-${idx}`}>optional</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={arg.greedy} onCheckedChange={(v) => updateArg(idx, { greedy: v })} id={`greedy-${idx}`} />
                          <Label htmlFor={`greedy-${idx}`}>greedy</Label>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeArg(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Switch id="autousage" checked={autoUsage} onCheckedChange={setAutoUsage} />
                  <Label htmlFor="autousage" className="cursor-pointer">Auto-generate usage</Label>
                </div>
                <Input disabled={autoUsage} value={usage} onChange={(e) => setUsage(e.target.value)} placeholder="/heal <player> [amount]" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Preview (Before <code>trigger:</code>)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-950 text-slate-100 rounded-2xl p-4 text-sm overflow-auto leading-6">
{commandBlock || "# Your command block will appear here as you fill out the form.\n# Example:\n# command /heal <player> [<amount>]:\n#     aliases: /h, /restore\n#     description: Heals a target player by a specified amount.\n#     usage: /heal <player> [amount]\n#     permission: myplugin.heal\n#     permission message: §cYou lack §emyplugin.heal§c.\n#     executable by: players\n#     cooldown: 5 seconds\n#     cooldown message: §7Cooldown: §e%cooldown% remaining.\n#     cooldown bypass: myplugin.bypass.cooldown\n# # <player> -> player\n# # <amount> -> number (optional)"}
              </pre>
              <p className="text-xs text-slate-500 mt-3">This generator intentionally omits the <code>trigger:</code> block so you can paste your own logic below it.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
