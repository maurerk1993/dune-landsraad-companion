import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trash2,
  Plus,
  Package,
  Pickaxe,
  ListTodo,
  Users,
  CheckCircle2,
  Circle,
  Moon,
  Sun,
  Landmark,
  Shield,
  Trophy,
  RotateCcw,
  Clock3,
  Check,
  LogOut,
  UserCircle2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const STORAGE_KEY = "dune_landsraad_companion_v1";
const BACKUP_FILENAME_PREFIX = "dune-landsraad-backup";
const METHOD_LANDSRAAD_BASE_URL =
  "https://www.method.gg/dune-awakening/all-landsraad-house-representative-locations-in-dune-awakening";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function houseAnchorSlug(houseName) {
  const base = houseName.toLowerCase().startsWith("house ") ? houseName.slice(6) : houseName;
  return base.toLowerCase().split(" ").filter(Boolean).join("-");
}

const ALL_LANDSRAAD_HOUSES = [
  "House Alexin",
  "House Argosaz",
  "House Dyvetz",
  "House Ecaz",
  "House Hagal",
  "House Hurata",
  "House Imota",
  "House Kenola",
  "House Lindaren",
  "House Maros",
  "House Mikarrol",
  "House Moritani",
  "House Mutelli",
  "House Novebruns",
  "House Richese",
  "House Sor",
  "House Spinette",
  "House Taligari",
  "House Thorvald",
  "House Tseida",
  "House Varota",
  "House Vernius",
  "House Wallach",
  "House Wayku",
  "House Wydras",
];

function makeDefaultHouses() {
  return ALL_LANDSRAAD_HOUSES.map((name) => ({
    id: uid(),
    name,
    current: 0,
    goals: [],
    pinned: false,
  }));
}

function makeDefaultState() {
  return {
    isDark: true,
    sessionTodos: [
      { id: uid(), text: "Run Deep Desert labs route", done: false },
      { id: uid(), text: "Check contracts before reset", done: false },
    ],
    materials: [
      { id: uid(), name: "Plasteel", amount: 300, done: false },
      { id: uid(), name: "Silicone Blocks", amount: 120, done: false },
    ],
    farmItems: [{ id: uid(), name: "Regis Disruptor Pistol parts", source: "Labs + Contracts", done: false }],
    generalTodos: [
      { id: uid(), text: "Refill water before run", done: false },
      { id: uid(), text: "Move old loot to storage", done: false },
    ],
    landsraadHouses: makeDefaultHouses(),
    houseSwatches: [{ id: uid(), text: "Atreides Sand Pattern", done: true }],
  };
}

function completionRowClass(done, isDark) {
  return done
    ? isDark
      ? "border-emerald-700 bg-emerald-950/30"
      : "border-emerald-500 bg-emerald-50"
    : isDark
      ? "bg-[#1a140f] border-[#3b2d1f]"
      : "bg-[#fffaf0] border-[#dcc39b]";
}

function completionTextClass(done, isDark) {
  return isDark ? (done ? "text-emerald-300" : "text-[#f2e7d5]") : done ? "text-emerald-700" : "text-[#3f2f1a]";
}

function completionSubtextClass(done, isDark) {
  return done ? (isDark ? "text-emerald-400/90" : "text-emerald-700/90") : isDark ? "text-[#b9a383]" : "text-[#7a6342]";
}

function checkboxClass(isDark, checked = false) {
  if (!isDark) return "";
  return checked
    ? "border-emerald-400 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-400 data-[state=checked]:text-emerald-950"
    : "border-[#b7925f] bg-[#2b2218] data-[state=unchecked]:bg-[#2b2218] data-[state=unchecked]:border-[#b7925f]";
}

function CheckboxControl({ checked, onChange, isDark }) {
  return (
    <Checkbox checked={checked} onCheckedChange={onChange} className={checkboxClass(isDark, Boolean(checked))}>
      <Check className={`h-3.5 w-3.5 ${isDark ? "text-[#0f0b07]" : ""}`} />
    </Checkbox>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, isDark }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`rounded-2xl p-2 border ${isDark ? "bg-[#1a1612] border-[#4a3a25]" : "bg-[#f1e6d2] border-[#d1b487]"}`}>
        <Icon className={`h-5 w-5 ${isDark ? "text-[#f2d7a6]" : "text-[#7a5a2e]"}`} />
      </div>
      <div>
        <h2 className={`text-lg font-semibold leading-tight ${isDark ? "text-[#f6ead4]" : "text-[#3a2b17]"}`}>{title}</h2>
        <p className={`text-sm ${isDark ? "text-[#c8bca7]" : "text-[#6b5636]"}`}>{subtitle}</p>
      </div>
    </div>
  );
}

function ProgressPill({ done, total, isDark }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <Badge
      variant="secondary"
      className={`text-xs ${
        isDark ? "bg-[#2a2118] text-[#e7d7bc] border border-[#4a3a25]" : "bg-[#efe1c8] text-[#5a4528] border border-[#c9a878]"
      }`}
    >
      {done}/{total} complete ({pct}%)
    </Badge>
  );
}

function TodoListCard({ title, description, icon, items, setItems, placeholder = "Add a task...", isDark }) {
  const [text, setText] = useState("");
  const completed = useMemo(() => items.filter((i) => i.done).length, [items]);

  const add = () => {
    const value = text.trim();
    if (!value) return;
    setItems([{ id: uid(), text: value, done: false }, ...items]);
    setText("");
  };

  const toggle = (id) => setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const remove = (id) => setItems(items.filter((i) => i.id !== id));

  return (
    <Card className={`rounded-2xl shadow-sm border ${isDark ? "bg-[#16120e] border-[#3e3122]" : "bg-[#fff9ef] border-[#d8bc91]"}`}>
      <CardHeader className="space-y-3">
        <SectionHeader icon={icon} title={title} subtitle={description} isDark={isDark} />
        <ProgressPill done={completed} total={items.length} isDark={isDark} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={placeholder}
            className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7] placeholder:text-[#a79274]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"}
          />
          <Button onClick={add} className={isDark ? "gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]" : "gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`flex items-center justify-between rounded-xl border p-3 ${completionRowClass(item.done, isDark)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckboxControl checked={item.done} onChange={() => toggle(item.id)} isDark={isDark} />
                    <div className="flex items-center gap-2 min-w-0">
                      {item.done ? (
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-700"}`} />
                      ) : (
                        <Circle className={`h-4 w-4 shrink-0 ${isDark ? "text-[#8f7a5d]" : "text-[#9a7a4b]"}`} />
                      )}
                      <p className={`text-sm truncate ${item.done ? "line-through" : ""} ${completionTextClass(item.done, isDark)}`}>{item.text}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)} className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function MaterialsCard({ materials, setMaterials, isDark }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const completed = useMemo(() => materials.filter((m) => m.done).length, [materials]);

  const add = () => {
    const n = name.trim();
    const a = Number(amount);
    if (!n || !Number.isFinite(a) || a <= 0) return;
    setMaterials([{ id: uid(), name: n, amount: a, done: false }, ...materials]);
    setName("");
    setAmount("");
  };

  const toggle = (id) => setMaterials(materials.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  const remove = (id) => setMaterials(materials.filter((m) => m.id !== id));

  return (
    <Card className={`rounded-2xl shadow-sm border ${isDark ? "bg-[#16120e] border-[#3e3122]" : "bg-[#fff9ef] border-[#d8bc91]"}`}>
      <CardHeader className="space-y-3">
        <SectionHeader icon={Package} title="Materials to Farm" subtitle="Track resource quantities needed for your next run." isDark={isDark} />
        <ProgressPill done={completed} total={materials.length} isDark={isDark} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-7">
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>Material</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Steel Ingot" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
          </div>
          <div className="sm:col-span-3">
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>Amount</Label>
            <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="250" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <Button onClick={add} className={isDark ? "w-full gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]" : "w-full gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {materials.map((m) => (
              <div key={m.id} className={`flex items-center justify-between rounded-xl border p-3 ${completionRowClass(m.done, isDark)}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <CheckboxControl checked={m.done} onChange={() => toggle(m.id)} isDark={isDark} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${m.done ? "line-through" : ""} ${completionTextClass(m.done, isDark)}`}>{m.name}</p>
                    <p className={`text-xs ${completionSubtextClass(m.done, isDark)}`}>Need: {m.amount.toLocaleString()}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(m.id)} className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ItemsCard({ items, setItems, isDark }) {
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const completed = useMemo(() => items.filter((i) => i.done).length, [items]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    setItems([{ id: uid(), name: n, source: source.trim(), done: false }, ...items]);
    setName("");
    setSource("");
  };

  const toggle = (id) => setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const remove = (id) => setItems(items.filter((i) => i.id !== id));

  return (
    <Card className={`rounded-2xl shadow-sm border ${isDark ? "bg-[#16120e] border-[#3e3122]" : "bg-[#fff9ef] border-[#d8bc91]"}`}>
      <CardHeader className="space-y-3">
        <SectionHeader icon={Pickaxe} title="Items to Farm" subtitle="Track gear/components and where you want to farm them." isDark={isDark} />
        <ProgressPill done={completed} total={items.length} isDark={isDark} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-5">
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>Item</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Disruptor Core" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
          </div>
          <div className="sm:col-span-5">
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>Farm Source (optional)</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g., Testing Labs / Contract" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <Button onClick={add} className={isDark ? "w-full gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]" : "w-full gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.id} className={`flex items-center justify-between rounded-xl border p-3 ${completionRowClass(i.done, isDark)}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <CheckboxControl checked={i.done} onChange={() => toggle(i.id)} isDark={isDark} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${i.done ? "line-through" : ""} ${completionTextClass(i.done, isDark)}`}>{i.name}</p>
                    <p className={`text-xs truncate ${completionSubtextClass(i.done, isDark)}`}>{i.source ? `Source: ${i.source}` : "No source added"}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(i.id)} className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function LandsraadCard({ houses, setHouses, isDark }) {
  const [rewardName, setRewardName] = useState("");
  const [requiredAmount, setRequiredAmount] = useState("");
  const [targetHouseId, setTargetHouseId] = useState("");

  const totalGoals = houses.reduce((acc, h) => acc + h.goals.length, 0);
  const achievedGoals = houses.reduce((acc, h) => acc + h.goals.filter((g) => g.done).length, 0);

  const sortedHouses = [...houses].sort((a, b) => {
    if (a.pinned === b.pinned) return a.name.localeCompare(b.name);
    return a.pinned ? -1 : 1;
  });

  const resetWeek = () => {
    setHouses(
      houses.map((h) => ({
        ...h,
        current: 0,
        goals: h.goals.map((g) => ({ ...g, done: false })),
      }))
    );
  };

  const togglePinned = (id) => setHouses(houses.map((h) => (h.id === id ? { ...h, pinned: !h.pinned } : h)));
  const removeHouse = (id) => {
    setHouses(houses.filter((h) => h.id !== id));
    if (targetHouseId === id) setTargetHouseId("");
  };
  const updateCurrent = (id, value) => {
    const n = Number(value);
    setHouses(houses.map((h) => (h.id === id ? { ...h, current: Number.isFinite(n) ? n : 0 } : h)));
  };

  const addGoal = () => {
    const rn = rewardName.trim();
    const req = Number(requiredAmount);
    if (!targetHouseId || !rn || !Number.isFinite(req) || req <= 0) return;
    setHouses(
      houses.map((h) =>
        h.id === targetHouseId ? { ...h, goals: [{ id: uid(), name: rn, required: req, done: false }, ...h.goals] } : h
      )
    );
    setRewardName("");
    setRequiredAmount("");
  };

  const toggleGoal = (houseId, goalId) => {
    setHouses(houses.map((h) => (h.id === houseId ? { ...h, goals: h.goals.map((g) => (g.id === goalId ? { ...g, done: !g.done } : g)) } : h)));
  };

  const removeGoal = (houseId, goalId) => {
    setHouses(houses.map((h) => (h.id === houseId ? { ...h, goals: h.goals.filter((g) => g.id !== goalId) } : h)));
  };

  return (
    <div className="space-y-4">
      <Card className={`rounded-2xl shadow-sm border ${isDark ? "bg-[#16120e] border-[#3e3122]" : "bg-[#fff9ef] border-[#d8bc91]"}`}>
        <CardHeader className="space-y-3">
          <SectionHeader icon={Landmark} title="Landsraad Tracker" subtitle="Track house progress, reward goals, and weekly turn-ins." isDark={isDark} />
          <div className="flex flex-wrap items-center gap-2">
            <ProgressPill done={achievedGoals} total={totalGoals} isDark={isDark} />
            <Badge className={isDark ? "bg-[#2a2118] text-[#e7d7bc] border border-[#4a3a25]" : "bg-[#efe1c8] text-[#5a4528] border border-[#c9a878]"}>
              <Clock3 className="h-3.5 w-3.5 mr-1" /> Weekly Cycle Helper
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={resetWeek} variant="outline" className={isDark ? "gap-2 border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]" : "gap-2 border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"}>
              <RotateCcw className="h-4 w-4" /> Reset for Week
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-5">
              <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>House for Goal</Label>
              <select value={targetHouseId} onChange={(e) => setTargetHouseId(e.target.value)} className={`h-10 w-full rounded-md border px-3 text-sm ${isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"}`}>
                <option value="">Select house</option>
                {sortedHouses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-4">
              <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>Reward Goal Name</Label>
              <Input value={rewardName} onChange={(e) => setRewardName(e.target.value)} placeholder="e.g., Weekly Cache" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
            </div>
            <div className="md:col-span-2">
              <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>Required Amount</Label>
              <Input type="number" min={1} value={requiredAmount} onChange={(e) => setRequiredAmount(e.target.value)} placeholder="e.g., 5000" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button onClick={addGoal} className={isDark ? "w-full gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]" : "w-full gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[360px] pr-2">
            <div className="space-y-3">
              {sortedHouses.map((h) => {
                const doneCount = h.goals.filter((g) => g.done).length;
                return (
                  <div key={h.id} className={`rounded-xl border p-3 space-y-3 ${isDark ? "bg-[#1a140f] border-[#3b2d1f]" : "bg-[#fffaf0] border-[#dcc39b]"}`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <Shield className={`h-4 w-4 ${isDark ? "text-emerald-400" : "text-emerald-700"}`} />
                        <p className={`font-semibold truncate ${isDark ? "text-[#f2e7d5]" : "text-[#3f2f1a]"}`}>{h.name}</p>
                        {h.pinned && <Badge className={isDark ? "bg-[#2a2118] text-[#e7d7bc] border border-[#4a3a25]" : "bg-[#efe1c8] text-[#5a4528] border border-[#c9a878]"}>Tracked</Badge>}
                        <Badge className={isDark ? "bg-[#2a2118] text-[#e7d7bc] border border-[#4a3a25]" : "bg-[#efe1c8] text-[#5a4528] border border-[#c9a878]"}>Goals: {doneCount}/{h.goals.length}</Badge>
                        <a href={`${METHOD_LANDSRAAD_BASE_URL}#${houseAnchorSlug(h.name)}`} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center rounded-md h-7 px-2 text-sm transition-colors cursor-pointer underline-offset-2 hover:underline ${isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}`}>
                          View location
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => togglePinned(h.id)} className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}>
                          {h.pinned ? "Untrack" : "Track"}
                        </Button>
                        <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>Current</Label>
                        <Input type="number" min={0} value={h.current} onChange={(e) => updateCurrent(h.id, e.target.value)} className={`w-24 h-8 ${isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"}`} />
                        <Button variant="ghost" size="icon" onClick={() => removeHouse(h.id)} className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {h.goals.map((g) => {
                        const remaining = Math.max(g.required - h.current, 0);
                        return (
                          <div key={g.id} className={`flex items-center justify-between rounded-lg border p-2 ${completionRowClass(g.done, isDark)}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckboxControl checked={g.done} onChange={() => toggleGoal(h.id, g.id)} isDark={isDark} />
                              <Trophy className={`h-4 w-4 ${g.done ? (isDark ? "text-emerald-400" : "text-emerald-700") : isDark ? "text-[#d5b277]" : "text-[#8a632f]"}`} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm truncate ${g.done ? "line-through" : ""} ${completionTextClass(g.done, isDark)}`}>{g.name}</p>
                                  {g.done && <Badge className={isDark ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700" : "bg-emerald-100 text-emerald-800 border border-emerald-400"}>Turned in</Badge>}
                                </div>
                                <p className={`text-xs ${completionSubtextClass(g.done, isDark)}`}>Requires: {g.required.toLocaleString()} • Remaining: {remaining.toLocaleString()}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeGoal(h.id, g.id)} className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                      {h.goals.length === 0 && <div className={`rounded-lg border border-dashed p-3 text-xs ${isDark ? "border-[#4a3a25] text-[#a79274]" : "border-[#caa779] text-[#7a6342]"}`}>No reward goals yet for this house.</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function HouseSwatchesCard({ swatches, setSwatches, isDark }) {
  const [swatchText, setSwatchText] = useState("");

  const addSwatch = () => {
    const text = swatchText.trim();
    if (!text) return;
    setSwatches([{ id: uid(), text, done: false }, ...swatches]);
    setSwatchText("");
  };

  const toggleSwatch = (id) => setSwatches(swatches.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  const removeSwatch = (id) => setSwatches(swatches.filter((s) => s.id !== id));

  return (
    <Card className={`rounded-2xl shadow-sm border ${isDark ? "bg-[#16120e] border-[#3e3122]" : "bg-[#fff9ef] border-[#d8bc91]"}`}>
      <CardHeader className="space-y-3">
        <SectionHeader icon={Shield} title="House Swatches Earned" subtitle="Track swatches you've unlocked." isDark={isDark} />
        <ProgressPill done={swatches.filter((s) => s.done).length} total={swatches.length} isDark={isDark} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={swatchText} onChange={(e) => setSwatchText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSwatch()} placeholder="e.g., Atreides Desert Camo" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7] placeholder:text-[#a79274]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
          <Button onClick={addSwatch} className={isDark ? "gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]" : "gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {swatches.map((s) => (
              <div key={s.id} className={`flex items-center justify-between rounded-xl border p-3 ${completionRowClass(s.done, isDark)}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <CheckboxControl checked={s.done} onChange={() => toggleSwatch(s.id)} isDark={isDark} />
                  <p className={`text-sm truncate ${s.done ? "line-through" : ""} ${completionTextClass(s.done, isDark)}`}>{s.text}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeSwatch(s.id)} className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AuthGate({ onSignedIn, isDark }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async () => {
    setMsg("");
    if (!email || !password) {
      setMsg("Please enter email and password.");
      return;
    }

    try {
      setBusy(true);
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created. You can now sign in.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.session) onSignedIn(data.session);
      }
    } catch (err) {
      setMsg(err?.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 ${isDark ? "bg-[radial-gradient(circle_at_top,_#2a1c12_0%,_#120f0c_45%,_#0d0b09_100%)] text-[#f2e7d5]" : "bg-[radial-gradient(circle_at_top,_#f6e9d3_0%,_#f2e4cd_45%,_#ebd9bd_100%)] text-[#3a2b17]"}`}>
      <Card className={`w-full max-w-md rounded-2xl border ${isDark ? "bg-[#16120e] border-[#3e3122]" : "bg-[#fff9ef] border-[#d8bc91]"}`}>
        <CardHeader className="space-y-2">
          <SectionHeader icon={UserCircle2} title="Sign in to your companion" subtitle="Each account has its own backend-saved data." isDark={isDark} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === "signin" ? "default" : "outline"} onClick={() => setMode("signin")} className={mode === "signin" ? (isDark ? "bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]" : "bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]") : ""}>
              Sign In
            </Button>
            <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")} className={mode === "signup" ? (isDark ? "bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]" : "bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]") : ""}>
              Create Account
            </Button>
          </div>

          <div>
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
          </div>

          <div>
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
          </div>

          <Button onClick={handleSubmit} disabled={busy} className={isDark ? "w-full bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]" : "w-full bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>

          {msg ? <p className={`text-xs ${isDark ? "text-[#d8c3a1]" : "text-[#6d4f27]"}`}>{msg}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  const fileInputRef = useRef(null);

  const defaults = makeDefaultState();

  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);

  const [hydrated, setHydrated] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);

  const [isDark, setIsDark] = useState(defaults.isDark);
  const [sessionTodos, setSessionTodos] = useState(defaults.sessionTodos);
  const [materials, setMaterials] = useState(defaults.materials);
  const [farmItems, setFarmItems] = useState(defaults.farmItems);
  const [generalTodos, setGeneralTodos] = useState(defaults.generalTodos);
  const [landsraadHouses, setLandsraadHouses] = useState(defaults.landsraadHouses);
  const [houseSwatches, setHouseSwatches] = useState(defaults.houseSwatches);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const saved = raw ? safeParse(raw, null) : null;

    if (saved && typeof saved === "object") {
      if (typeof saved.isDark === "boolean") setIsDark(saved.isDark);
      if (Array.isArray(saved.sessionTodos)) setSessionTodos(saved.sessionTodos);
      if (Array.isArray(saved.materials)) setMaterials(saved.materials);
      if (Array.isArray(saved.farmItems)) setFarmItems(saved.farmItems);
      if (Array.isArray(saved.generalTodos)) setGeneralTodos(saved.generalTodos);
      if (Array.isArray(saved.landsraadHouses)) setLandsraadHouses(saved.landsraadHouses);
      if (Array.isArray(saved.houseSwatches)) setHouseSwatches(saved.houseSwatches);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!session?.user?.id || !hydrated) return;

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_app_state")
          .select("state")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (cancelled) return;

        if (data?.state && typeof data.state === "object") {
          const s = data.state;
          if (typeof s.isDark === "boolean") setIsDark(s.isDark);
          if (Array.isArray(s.sessionTodos)) setSessionTodos(s.sessionTodos);
          if (Array.isArray(s.materials)) setMaterials(s.materials);
          if (Array.isArray(s.farmItems)) setFarmItems(s.farmItems);
          if (Array.isArray(s.generalTodos)) setGeneralTodos(s.generalTodos);
          if (Array.isArray(s.landsraadHouses)) setLandsraadHouses(s.landsraadHouses);
          if (Array.isArray(s.houseSwatches)) setHouseSwatches(s.houseSwatches);
        } else {
          await supabase.from("user_app_state").upsert({
            user_id: session.user.id,
            state: {
              isDark,
              sessionTodos,
              materials,
              farmItems,
              generalTodos,
              landsraadHouses,
              houseSwatches,
            },
            updated_at: new Date().toISOString(),
          });
        }

        setCloudReady(true);
      } catch (e) {
        console.error("Cloud load failed:", e?.message || e);
        setCloudReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ isDark, sessionTodos, materials, farmItems, generalTodos, landsraadHouses, houseSwatches })
    );
  }, [hydrated, isDark, sessionTodos, materials, farmItems, generalTodos, landsraadHouses, houseSwatches]);

  useEffect(() => {
    if (!session?.user?.id || !hydrated || !cloudReady) return;

    const t = setTimeout(async () => {
      try {
        setCloudSaving(true);
        await supabase.from("user_app_state").upsert({
          user_id: session.user.id,
          state: {
            isDark,
            sessionTodos,
            materials,
            farmItems,
            generalTodos,
            landsraadHouses,
            houseSwatches,
          },
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Cloud save failed:", e?.message || e);
      } finally {
        setCloudSaving(false);
      }
    }, 700);

    return () => clearTimeout(t);
  }, [session?.user?.id, hydrated, cloudReady, isDark, sessionTodos, materials, farmItems, generalTodos, landsraadHouses, houseSwatches]);

  const exportBackup = () => {
    if (typeof window === "undefined") return;
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "Dune Awakening: Landsraad Companion",
      data: { isDark, sessionTodos, materials, farmItems, generalTodos, landsraadHouses, houseSwatches },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${BACKUP_FILENAME_PREFIX}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importBackupFromFile = (file) => {
    if (!file || typeof window === "undefined") return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = safeParse(String(e.target?.result || ""), null);
      const d = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
      if (!d || typeof d !== "object") return window.alert("Invalid backup file format.");
      if (typeof d.isDark === "boolean") setIsDark(d.isDark);
      if (Array.isArray(d.sessionTodos)) setSessionTodos(d.sessionTodos);
      if (Array.isArray(d.materials)) setMaterials(d.materials);
      if (Array.isArray(d.farmItems)) setFarmItems(d.farmItems);
      if (Array.isArray(d.generalTodos)) setGeneralTodos(d.generalTodos);
      if (Array.isArray(d.landsraadHouses)) setLandsraadHouses(d.landsraadHouses);
      if (Array.isArray(d.houseSwatches)) setHouseSwatches(d.houseSwatches);
      window.alert("Backup imported successfully.");
    };
    reader.readAsText(file);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCloudReady(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#120f0c] text-[#f2e7d5]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!session) {
    return <AuthGate onSignedIn={setSession} isDark={isDark} />;
  }

  return (
    <div className={`min-h-screen w-full transition-colors ${isDark ? "bg-[radial-gradient(circle_at_top,_#2a1c12_0%,_#120f0c_45%,_#0d0b09_100%)] text-[#f2e7d5]" : "bg-[radial-gradient(circle_at_top,_#f6e9d3_0%,_#f2e4cd_45%,_#ebd9bd_100%)] text-[#3a2b17]"}`}>
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl border p-6 md:p-8 shadow-sm backdrop-blur-sm ${isDark ? "bg-[#18130e]/80 border-[#4a3a25]" : "bg-[#fff4df]/80 border-[#c9a878]"}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${isDark ? "border-[#5a462c] text-[#ccb089]" : "border-[#caa779] text-[#76572f]"}`}>
                <Users className="h-3.5 w-3.5" /> Co-op Tracker
              </div>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Dune Awakening: Landsraad Companion</h1>
              <p className={`text-sm md:text-base max-w-2xl ${isDark ? "text-[#c8bca7]" : "text-[#6b5636]"}`}>Your app for tracking everything in Dune Awakening.</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={exportBackup} className={`inline-flex items-center rounded-md h-9 px-3 text-sm border ${isDark ? "border-[#5a462c] text-[#e6d0ac] hover:bg-[#2a2118]" : "border-[#c9a878] text-[#6d4f27] hover:bg-[#efdfc2]"}`}>
                  Export Backup
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className={`inline-flex items-center rounded-md h-9 px-3 text-sm border ${isDark ? "border-[#5a462c] text-[#e6d0ac] hover:bg-[#2a2118]" : "border-[#c9a878] text-[#6d4f27] hover:bg-[#efdfc2]"}`}>
                  Import Backup
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    importBackupFromFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <div className={`text-xs ${isDark ? "text-[#c8bca7]" : "text-[#6b5636]"}`}>
                Signed in as <span className="font-semibold">{session.user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsDark((v) => !v)} className={isDark ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]" : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"}>
                  {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </Button>
                <Button variant="outline" onClick={signOut} className={isDark ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]" : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              <div className={`text-xs ${isDark ? "text-[#a79274]" : "text-[#7a6342]"}`}>
                {!cloudReady ? "Initializing cloud sync..." : cloudSaving ? "Saving to cloud..." : "Cloud sync active"}
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="coop" className="space-y-4">
          <TabsList className={`grid grid-cols-2 md:grid-cols-6 gap-2 h-auto rounded-2xl p-1 border ${isDark ? "bg-[#18130e]/80 border-[#4a3a25]" : "bg-[#fff3dc] border-[#c9a878]"}`}>
            <TabsTrigger value="coop" className="rounded-xl gap-2"><ListTodo className="h-4 w-4" /> Session To-Do</TabsTrigger>
            <TabsTrigger value="materials" className="rounded-xl gap-2"><Package className="h-4 w-4" /> Materials</TabsTrigger>
            <TabsTrigger value="items" className="rounded-xl gap-2"><Pickaxe className="h-4 w-4" /> Items to Farm</TabsTrigger>
            <TabsTrigger value="landsraad" className="rounded-xl gap-2"><Landmark className="h-4 w-4" /> Landsraad</TabsTrigger>
            <TabsTrigger value="swatches" className="rounded-xl gap-2"><Shield className="h-4 w-4" /> Swatches</TabsTrigger>
            <TabsTrigger value="general" className="rounded-xl gap-2"><ListTodo className="h-4 w-4" /> General To-Do</TabsTrigger>
          </TabsList>

          <TabsContent value="coop">
            <TodoListCard title="Session To-Do" description="Shared checklist for your next co-op session." icon={ListTodo} items={sessionTodos} setItems={setSessionTodos} placeholder="e.g., Run Testing Labs in Deep Desert" isDark={isDark} />
          </TabsContent>
          <TabsContent value="materials">
            <MaterialsCard materials={materials} setMaterials={setMaterials} isDark={isDark} />
          </TabsContent>
          <TabsContent value="items">
            <ItemsCard items={farmItems} setItems={setFarmItems} isDark={isDark} />
          </TabsContent>
          <TabsContent value="landsraad">
            <LandsraadCard houses={landsraadHouses} setHouses={setLandsraadHouses} isDark={isDark} />
          </TabsContent>
          <TabsContent value="swatches">
            <HouseSwatchesCard swatches={houseSwatches} setSwatches={setHouseSwatches} isDark={isDark} />
          </TabsContent>
          <TabsContent value="general">
            <TodoListCard title="General To-Do" description="Anything outside immediate farming runs." icon={ListTodo} items={generalTodos} setItems={setGeneralTodos} placeholder="e.g., Clean stash / sort schematics" isDark={isDark} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}