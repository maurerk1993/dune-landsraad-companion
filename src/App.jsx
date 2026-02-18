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
  Search,
  X,
  Settings,
  Pencil,
  EyeOff,
  Wrench,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const STORAGE_KEY = "dune_landsraad_companion_v1";
const SHARED_TODOS_CACHE_KEY = "dune_landsraad_shared_todos_cache_v1";
const BACKUP_FILENAME_PREFIX = "dune-landsraad-backup";
const APP_VERSION = "3.6.0";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const RESET_WARNING_DISMISS_KEY = "dune_landsraad_reset_warning_dismissals_v1";
const NEW_YORK_TIME_ZONE = "America/New_York";
const ADMIN_EMAIL = "maurerk1993@gmail.com";
const LOCATION_CONTENT_KEY = "global";
const LOCATION_IMAGES_BUCKET = "landsraad-location-images";
const MAP_LOCATION_OPTIONS = ["Hagga Basin", "Deep Desert", "Arakeen", "Harko Village"];

const WEEKDAY_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const APP_CHANGE_NOTES = [
  {
    version: "3.6.0",
    notes: [
      "Improved reset alert readability across Light, Atreides, and Spice themes with higher-contrast warning surfaces and text.",
      "Retuned warning checkbox colors so checked and unchecked states are clearly visible in every theme.",
      "Adjusted warning timer alert palette so urgent red states stay legible without eye strain in lighter themes.",
    ],
  },
  {
    version: "3.5.0",
    notes: [
      "Weekly reset timer now pulses red when there are less than 24 hours left before reset.",
      "Added a new Deep Desert reset alert popup that appears on login within the final 24-hour window.",
      "Added a 'Do not display for the rest of the week' option for the reset alert and an admin test toggle to simulate the final 24-hour warning state.",
    ],
  },
  {
    version: "3.4.4",
    notes: [
      "Added a house swatch status bubble beside each Landsraad house so you can see earned state without leaving the tab.",
      "Landsraad now shows House Swatch Earned when the matching Placeable Swatch is completed on the Swatches tab.",
      "Landsraad now shows House Swatch Not Yet Earned when the matching Placeable Swatch is still incomplete.",
    ],
  },
  {
    version: "3.4.3",
    notes: [
      "Added per-house map location dropdowns in Landsraad Location Admin with Hagga Basin, Deep Desert, Arakeen, and Harko Village options.",
      "Updated Landsraad map badges and View Location popup to use the admin-selected map location.",
      "Corrected default map locations for House Maros, House Mutelli, and House Spinette.",
    ],
  },
  {
    version: "3.4.2",
    notes: [
      "Moved Dune Tools admin controls to the bottom of the card so tool links are shown first.",
      "Set Dune Tools admin controls to stay hidden by default until Show Admin Controls is clicked.",
    ],
  },
  {
    version: "3.4.1",
    notes: [
      "Added an admin-only Hide Admin Controls toggle on Dune Tools so links can be viewed without edit controls.",
      "Kept Dune Tools editing available behind a Show Admin Controls toggle when needed.",
    ],
  },
  {
    version: "3.4.0",
    notes: [
      "Added click-outside close behavior to View Location popups while keeping the Close button.",
      "Added a new Dune Tools page entry point below the app title for quick access.",
      "Added admin-managed Dune Tools links with shared name, URL, and notes visible to all users.",
    ],
  },
  {
    version: "3.3.0",
    notes: [
      "Added edit (pencil) actions beside delete controls on Shared To-Do, Materials, and Items to Farm entries.",
      "Added Hide Completed toggles to Shared To-Do, Materials, and Items to Farm lists.",
      "Items to Farm now uses a Farm Source dropdown fed by admin-managed farm source options.",
      "Expanded admin settings so farm sources can be added/removed and synced for all users.",
    ],
  },
  {
    version: "3.2.2",
    notes: [
      "Reworked Landsraad mobile/desktop conditional rendering to avoid JSX token mismatch in production builds.",
      "Eliminated the ternary close pattern near Tabs content that triggered Vercel esbuild parse errors.",
    ],
  },
  {
    version: "3.2.1",
    notes: [
      "Fixed the JSX structure around the main Tabs layout to prevent Vercel build parse failures.",
      "Confirmed production build succeeds after the layout syntax fix.",
    ],
  },
  {
    version: "3.2.0",
    notes: [
      "Improved Atreides readability with stronger contrast on text, icons, and status colors.",
      "Retuned Atreides component surfaces/buttons to a more pleasant darker green palette.",
    ],
  },
  {
    version: "3.1.0",
    notes: [
      "Added new Spice theme with a light-purple UI and sand-toned background.",
      "Updated Atreides theme to a darker green palette for lower eye strain.",
      "Renamed Swatches core badge text to Landsraad reward.",
    ],
  },
  {
    version: "3.0.0",
    notes: ["Change Notes now shows the latest 10 revisions in a scrollable list."],
  },
  {
    version: "2.9.0",
    notes: [
      "Removed sample Shared To-Do items for new sessions.",
      "Added shared to-do local cache fallback so refresh won't reset list.",
      "Preserved previously entered shared to-dos from legacy local data.",
    ],
  },
  {
    version: "2.8.0",
    notes: [
      "Added Change Notes panel with version history.",
      "Repurposed Session To-Do to Shared To-Do.",
      "Shared To-Do now syncs to a shared Supabase record for all users.",
    ],
  },
  {
    version: "2.7.0",
    notes: ["Made Atreides theme fully green across UI surfaces."],
  },
  {
    version: "2.6.0",
    notes: ["Added clearable search inputs and Atreides theme option."],
  },
  {
    version: "2.5.0",
    notes: ["Removed the Route Assistant UI box from Landsraad tab."],
  },
  {
    version: "2.4.0",
    notes: ["Set Landsraad as the default landing tab."],
  },
  {
    version: "2.3.0",
    notes: ["Fixed mobile Landsraad scroll-lock by avoiding nested mobile scroll area."],
  },
  {
    version: "2.2.0",
    notes: ["Kept Select House dropdown alphabetical and protected core swatches from deletion."],
  },
  {
    version: "2.1.0",
    notes: ["Added mobile detection and mobile-specific layout improvements."],
  },
  {
    version: "2.0.0",
    notes: ["Restored deleted houses automatically and fixed Current input editing behavior."],
  },
  {
    version: "1.9.0",
    notes: ["Backfilled prepopulated house swatches for existing users."],
  },
  {
    version: "1.8.0",
    notes: ["Prepopulated all house placeable swatches and enhanced light-mode spice tint."],
  },
  {
    version: "1.7.0",
    notes: ["Added subtle spice-inspired purple/red ambient accents to dark mode."],
  },
];

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

const DEFAULT_HOUSE_MAPS = {
    "House Alexin": "Harko Village",
    "House Maros": "Deep Desert",
    "House Mutelli": "Arakeen",
    "House Spinette": "Harko Village",
    "House Varota": "Arakeen",
    "House Wallach": "Arakeen",
    "House Wayku": "Deep Desert",
};

function getDefaultHouseMapLabel(houseName) {
  return DEFAULT_HOUSE_MAPS[houseName] || "Hagga Basin";
}

function houseMapLabel(houseName, locationEntries = {}) {
  const selectedMap = locationEntries?.[houseName]?.mapLocation;
  if (MAP_LOCATION_OPTIONS.includes(selectedMap)) return selectedMap;

  return getDefaultHouseMapLabel(houseName);
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  const asUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  return asUtc - date.getTime();
}

function zonedDateTimeToUtcDate({ year, month, day, hour = 0, minute = 0, second = 0 }, timeZone) {
  const utc = Date.UTC(year, month - 1, day, hour, minute, second);

  let timestamp = utc;
  for (let i = 0; i < 2; i += 1) {
    const offset = getTimeZoneOffsetMs(new Date(timestamp), timeZone);
    timestamp = utc - offset;
  }

  return new Date(timestamp);
}

function getNextTuesdayMidnightEt(now = new Date()) {
  const nyDateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: NEW_YORK_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);

  const map = Object.fromEntries(
    nyDateParts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const weekday = WEEKDAY_INDEX[map.weekday] ?? 0;

  let daysUntilTuesday = (2 - weekday + 7) % 7;
  if (daysUntilTuesday === 0) {
    daysUntilTuesday = 7;
  }

  return zonedDateTimeToUtcDate(
    {
      year,
      month,
      day: day + daysUntilTuesday,
      hour: 0,
      minute: 0,
      second: 0,
    },
    NEW_YORK_TIME_ZONE
  );
}

function getTimeUntilNextTuesdayMidnightEt(now = new Date()) {
  const targetEtMidnight = getNextTuesdayMidnightEt(now);

  return Math.max(0, targetEtMidnight.getTime() - now.getTime());
}

function readResetWarningDismissals() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(RESET_WARNING_DISMISS_KEY);
  const parsed = raw ? safeParse(raw, {}) : {};
  return parsed && typeof parsed === "object" ? parsed : {};
}

function writeResetWarningDismissals(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RESET_WARNING_DISMISS_KEY, JSON.stringify(value));
}

function isResetWarningDismissedForWeek(userId, weekKey) {
  if (!userId || !weekKey) return false;
  const dismissals = readResetWarningDismissals();
  return dismissals[userId] === weekKey;
}

function setResetWarningDismissedForWeek(userId, weekKey, dismissed) {
  if (!userId) return;
  const dismissals = readResetWarningDismissals();

  if (dismissed) {
    dismissals[userId] = weekKey;
  } else {
    delete dismissals[userId];
  }

  writeResetWarningDismissals(dismissals);
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpointPx}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const sync = (event) => setIsMobile(event.matches);

    mediaQuery.addEventListener("change", sync);

    return () => mediaQuery.removeEventListener("change", sync);
  }, [breakpointPx]);

  return isMobile;
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

function coerceHouseCurrent(value) {
  if (value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function makeDefaultHouses() {
  return ALL_LANDSRAAD_HOUSES.map((name) => ({
    id: uid(),
    name,
    current: 0,
    goals: [],
    pinned: false,
  }));
}

function normalizeLandsraadHouses(houses = []) {
  const seeded = makeDefaultHouses();
  const existingByName = new Map(
    houses
      .filter((house) => house && typeof house.name === "string")
      .map((house) => [house.name, house])
  );

  return seeded.map((seed) => {
    const existing = existingByName.get(seed.name);
    if (!existing) return seed;

    return {
      ...seed,
      ...existing,
      id: existing.id || seed.id,
      name: seed.name,
      current: coerceHouseCurrent(existing.current),
      goals: Array.isArray(existing.goals) ? existing.goals : [],
      pinned: Boolean(existing.pinned),
    };
  });
}

function makeDefaultHouseLocationEntries() {
  return ALL_LANDSRAAD_HOUSES.reduce((acc, houseName) => {
    acc[houseName] = {
      imageUrl: "",
      storagePath: "",
      notes: "",
      mapLocation: getDefaultHouseMapLabel(houseName),
    };
    return acc;
  }, {});
}

function normalizeHouseLocationEntries(entries = {}) {
  const seeded = makeDefaultHouseLocationEntries();

  if (!entries || typeof entries !== "object") {
    return seeded;
  }

  return ALL_LANDSRAAD_HOUSES.reduce((acc, houseName) => {
    const existing = entries[houseName];
    acc[houseName] = {
      imageUrl: typeof existing?.imageUrl === "string" ? existing.imageUrl : "",
      storagePath: typeof existing?.storagePath === "string" ? existing.storagePath : "",
      notes: typeof existing?.notes === "string" ? existing.notes : "",
      mapLocation: MAP_LOCATION_OPTIONS.includes(existing?.mapLocation)
        ? existing.mapLocation
        : getDefaultHouseMapLabel(houseName),
    };
    return acc;
  }, {});
}

function normalizeFarmSources(sources = []) {
  if (!Array.isArray(sources)) return [];

  return Array.from(
    new Set(
      sources
        .map((source) => String(source || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function makeDefaultDuneTools() {
  return [
    {
      id: uid(),
      name: "Dune: Awakening Intel Map",
      url: "https://duneawakeningtracker.com/",
      notes: "Interactive map and community tracking resources.",
    },
    {
      id: uid(),
      name: "Dune: Awakening Database",
      url: "https://awakening.wiki/",
      notes: "Guides, references, and item information.",
    },
  ];
}

function normalizeDuneTools(tools = []) {
  if (!Array.isArray(tools)) return makeDefaultDuneTools();

  const normalized = tools
    .map((tool) => {
      const name = String(tool?.name || "").trim();
      const url = String(tool?.url || "").trim();
      const notes = String(tool?.notes || "").trim();
      if (!name || !url) return null;
      return {
        id: String(tool?.id || uid()),
        name,
        url,
        notes,
      };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : makeDefaultDuneTools();
}

function makeDefaultHouseSwatches() {
  return ALL_LANDSRAAD_HOUSES.map((houseName) => ({
    id: uid(),
    text: `${houseName} Placeable Swatch`,
    done: false,
  }));
}

function isDefaultHouseSwatchText(text) {
  if (!text) return false;
  const normalizedText = String(text).trim().toLowerCase();
  return ALL_LANDSRAAD_HOUSES.some(
    (houseName) => `${houseName} Placeable Swatch`.toLowerCase() === normalizedText
  );
}

function hasEarnedHouseSwatch(houseName, swatches = []) {
  const targetText = `${houseName} Placeable Swatch`.toLowerCase();
  return swatches.some(
    (swatch) => String(swatch?.text || "").trim().toLowerCase() === targetText && Boolean(swatch?.done)
  );
}

function normalizeHouseSwatches(swatches = []) {
  const seeded = makeDefaultHouseSwatches();
  const existingByText = new Map(
    swatches.map((swatch) => [String(swatch.text || "").trim().toLowerCase(), swatch])
  );

  const mergedSeeded = seeded.map((seed) => {
    const existing = existingByText.get(seed.text.toLowerCase());
    return existing
      ? { ...seed, id: existing.id || seed.id, done: Boolean(existing.done) }
      : seed;
  });

  const extras = swatches.filter((swatch) => {
    const key = String(swatch.text || "").trim().toLowerCase();
    return key && !mergedSeeded.some((seed) => seed.text.toLowerCase() === key);
  });

  return [...mergedSeeded, ...extras];
}

function makeDefaultState() {
  return {
    themeMode: "dark",
    isDark: true,
    sessionTodos: [],
    materials: [
      { id: uid(), name: "Plasteel", amount: 300, done: false },
      { id: uid(), name: "Silicone Blocks", amount: 120, done: false },
    ],
    farmItems: [
      {
        id: uid(),
        name: "Regis Disruptor Pistol parts",
        source: "Labs + Contracts",
        done: false,
      },
    ],
    farmSources: ["Contracts", "Deep Desert", "Testing Labs"],
    generalTodos: [
      { id: uid(), text: "Refill water before run", done: false },
      { id: uid(), text: "Move old loot to storage", done: false },
    ],
    landsraadHouses: makeDefaultHouses(),
    houseSwatches: makeDefaultHouseSwatches(),
    trackedOnlyMode: false,
    duneTools: makeDefaultDuneTools(),
  };
}

function cycleThemeMode(current) {
  if (current === "dark") return "light";
  if (current === "light") return "atreides";
  if (current === "atreides") return "spice";
  return "dark";
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
  return isDark
    ? done
      ? "text-emerald-300"
      : "text-[#f2e7d5]"
    : done
      ? "text-emerald-700"
      : "text-[#3f2f1a]";
}

function completionSubtextClass(done, isDark) {
  return done
    ? isDark
      ? "text-emerald-400/90"
      : "text-emerald-700/90"
    : isDark
      ? "text-[#b9a383]"
      : "text-[#7a6342]";
}

function checkboxClass({ isDark, isAtreides = false, isSpice = false, checked = false }) {
  if (isDark) {
    return checked
      ? "border-emerald-400 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-400 data-[state=checked]:text-emerald-950"
      : "border-[#b7925f] bg-[#2b2218] data-[state=unchecked]:bg-[#2b2218] data-[state=unchecked]:border-[#b7925f]";
  }

  if (isAtreides) {
    return checked
      ? "border-emerald-500 data-[state=checked]:bg-emerald-300 data-[state=checked]:border-emerald-500 data-[state=checked]:text-emerald-950"
      : "border-[#6b8d76] bg-[#2a4338] data-[state=unchecked]:bg-[#2a4338] data-[state=unchecked]:border-[#6b8d76]";
  }

  if (isSpice) {
    return checked
      ? "border-violet-500 data-[state=checked]:bg-violet-400 data-[state=checked]:border-violet-500 data-[state=checked]:text-violet-950"
      : "border-[#8d64b1] bg-[#f1e1fa] data-[state=unchecked]:bg-[#f1e1fa] data-[state=unchecked]:border-[#8d64b1]";
  }

  return checked
    ? "border-amber-500 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-500 data-[state=checked]:text-amber-950"
    : "border-[#b88f5a] bg-[#fff6e8] data-[state=unchecked]:bg-[#fff6e8] data-[state=unchecked]:border-[#b88f5a]";
}

function CheckboxControl({ checked, onChange, isDark, isAtreides = false, isSpice = false }) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onChange}
      className={checkboxClass({ isDark, isAtreides, isSpice, checked: Boolean(checked) })}
    >
      <Check className={`h-3.5 w-3.5 ${isDark ? "text-[#0f0b07]" : ""}`} />
    </Checkbox>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, isDark }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`rounded-2xl p-2 border ${
          isDark
            ? "bg-[#1a1612] border-[#4a3a25]"
            : "bg-[#f1e6d2] border-[#d1b487]"
        }`}
      >
        <Icon
          className={`h-5 w-5 ${
            isDark ? "text-[#f2d7a6]" : "text-[#7a5a2e]"
          }`}
        />
      </div>
      <div>
        <h2
          className={`text-lg font-semibold leading-tight ${
            isDark ? "text-[#f6ead4]" : "text-[#3a2b17]"
          }`}
        >
          {title}
        </h2>
        <p
          className={`text-sm ${isDark ? "text-[#c8bca7]" : "text-[#6b5636]"}`}
        >
          {subtitle}
        </p>
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
        isDark
          ? "bg-[#2a2118] text-[#e7d7bc] border border-[#4a3a25]"
          : "bg-[#efe1c8] text-[#5a4528] border border-[#c9a878]"
      }`}
    >
      {done}/{total} complete ({pct}%)
    </Badge>
  );
}

function TodoListCard({
  title,
  description,
  icon,
  items,
  setItems,
  placeholder = "Add a task...",
  isDark,
}) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const completed = useMemo(() => items.filter((i) => i.done).length, [items]);

  const add = () => {
    const value = text.trim();
    if (!value) return;
    setItems([{ id: uid(), text: value, done: false }, ...items]);
    setText("");
  };

  const toggle = (id) =>
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const remove = (id) => setItems(items.filter((i) => i.id !== id));

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingText(item.text || "");
  };

  const saveEdit = (id) => {
    const value = editingText.trim();
    if (!value) return;
    setItems(items.map((item) => (item.id === id ? { ...item, text: value } : item)));
    setEditingId(null);
    setEditingText("");
  };

  const visibleItems = hideCompleted ? items.filter((item) => !item.done) : items;

  return (
    <Card
      className={`rounded-2xl border shadow-lg shadow-black/10 backdrop-blur-[1px] ${
        isDark
          ? "bg-[#16120e] border-[#3e3122]"
          : "bg-[#fff9ef] border-[#d8bc91]"
      }`}
    >
      <CardHeader className="space-y-3">
        <SectionHeader
          icon={icon}
          title={title}
          subtitle={description}
          isDark={isDark}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ProgressPill done={completed} total={items.length} isDark={isDark} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setHideCompleted((prev) => !prev)}
            className={
              isDark
                ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#d7c19d]"
                : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
            }
          >
            <EyeOff className="h-3.5 w-3.5 mr-1" />
            {hideCompleted ? "Show completed" : "Hide completed"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={placeholder}
            className={
              isDark
                ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7] placeholder:text-[#a79274]"
                : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
            }
          />
          <Button
            onClick={add}
            className={
              isDark
                ? "gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]"
                : "gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
            }
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {visibleItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`flex items-center justify-between rounded-xl border p-3 ${completionRowClass(
                    item.done,
                    isDark
                  )}`}
                >
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    <CheckboxControl
                      checked={item.done}
                      onChange={() => toggle(item.id)}
                      isDark={isDark}
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      {item.done ? (
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${
                            isDark ? "text-emerald-400" : "text-emerald-700"
                          }`}
                        />
                      ) : (
                        <Circle
                          className={`h-4 w-4 shrink-0 ${
                            isDark ? "text-[#8f7a5d]" : "text-[#9a7a4b]"
                          }`}
                        />
                      )}
                      {editingId === item.id ? (
                        <Input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(item.id);
                          }}
                          className={
                            isDark
                              ? "h-8 bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                              : "h-8 bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                          }
                        />
                      ) : (
                        <p
                          className={`text-sm truncate ${
                            item.done ? "line-through" : ""
                          } ${completionTextClass(item.done, isDark)}`}
                        >
                          {item.text}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {editingId === item.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => saveEdit(item.id)}
                          className={isDark ? "text-emerald-300 hover:bg-[#2a2118]" : "text-emerald-700 hover:bg-[#efe1c8]"}
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingId(null);
                            setEditingText("");
                          }}
                          className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(item)}
                        className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(item.id)}
                      className={`shrink-0 ${
                        isDark
                          ? "text-[#ccb089] hover:bg-[#2a2118]"
                          : "text-[#7d5c31] hover:bg-[#efe1c8]"
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingAmount, setEditingAmount] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const completed = useMemo(
    () => materials.filter((m) => m.done).length,
    [materials]
  );

  const add = () => {
    const n = name.trim();
    const a = Number(amount);
    if (!n || !Number.isFinite(a) || a <= 0) return;
    setMaterials([{ id: uid(), name: n, amount: a, done: false }, ...materials]);
    setName("");
    setAmount("");
  };

  const toggle = (id) =>
    setMaterials(materials.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  const remove = (id) => setMaterials(materials.filter((m) => m.id !== id));

  const startEdit = (material) => {
    setEditingId(material.id);
    setEditingName(material.name || "");
    setEditingAmount(String(material.amount || ""));
  };

  const saveEdit = (id) => {
    const nextName = editingName.trim();
    const nextAmount = Number(editingAmount);
    if (!nextName || !Number.isFinite(nextAmount) || nextAmount <= 0) return;

    setMaterials(
      materials.map((material) =>
        material.id === id
          ? { ...material, name: nextName, amount: nextAmount }
          : material
      )
    );

    setEditingId(null);
    setEditingName("");
    setEditingAmount("");
  };

  const visibleMaterials = hideCompleted
    ? materials.filter((material) => !material.done)
    : materials;

  return (
    <Card
      className={`rounded-2xl border shadow-lg shadow-black/10 backdrop-blur-[1px] ${
        isDark
          ? "bg-[#16120e] border-[#3e3122]"
          : "bg-[#fff9ef] border-[#d8bc91]"
      }`}
    >
      <CardHeader className="space-y-3">
        <SectionHeader
          icon={Package}
          title="Materials to Farm"
          subtitle="Track resource quantities needed for your next run."
          isDark={isDark}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ProgressPill done={completed} total={materials.length} isDark={isDark} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setHideCompleted((prev) => !prev)}
            className={
              isDark
                ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#d7c19d]"
                : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
            }
          >
            <EyeOff className="h-3.5 w-3.5 mr-1" />
            {hideCompleted ? "Show completed" : "Hide completed"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-7">
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
              Material
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Steel Ingot"
              className={
                isDark
                  ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                  : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
              }
            />
          </div>
          <div className="sm:col-span-3">
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
              Amount
            </Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="250"
              className={
                isDark
                  ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                  : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
              }
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <Button
              onClick={add}
              className={
                isDark
                  ? "w-full gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]"
                  : "w-full gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
              }
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {visibleMaterials.map((m) => (
              <div
                key={m.id}
                className={`flex items-center justify-between rounded-xl border p-3 ${completionRowClass(
                  m.done,
                  isDark
                )}`}
              >
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <CheckboxControl
                    checked={m.done}
                    onChange={() => toggle(m.id)}
                    isDark={isDark}
                  />
                  {editingId === m.id ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className={isDark ? "h-8 bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "h-8 bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"}
                      />
                      <Input
                        type="number"
                        min={1}
                        value={editingAmount}
                        onChange={(e) => setEditingAmount(e.target.value)}
                        className={isDark ? "h-8 bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "h-8 bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"}
                      />
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          m.done ? "line-through" : ""
                        } ${completionTextClass(m.done, isDark)}`}
                      >
                        {m.name}
                      </p>
                      <p className={`text-xs ${completionSubtextClass(m.done, isDark)}`}>
                        Need: {Number(m.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {editingId === m.id ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => saveEdit(m.id)} className={isDark ? "text-emerald-300 hover:bg-[#2a2118]" : "text-emerald-700 hover:bg-[#efe1c8]"} title="Save">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                          setEditingAmount("");
                        }}
                        className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(m)}
                      className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(m.id)}
                    className={`shrink-0 ${
                      isDark
                        ? "text-[#ccb089] hover:bg-[#2a2118]"
                        : "text-[#7d5c31] hover:bg-[#efe1c8]"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ItemsCard({ items, setItems, farmSources, isDark }) {
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingSource, setEditingSource] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const completed = useMemo(() => items.filter((i) => i.done).length, [items]);

  const sourceOptions = useMemo(() => normalizeFarmSources(farmSources), [farmSources]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    setItems([{ id: uid(), name: n, source: source.trim(), done: false }, ...items]);
    setName("");
    setSource("");
  };

  const toggle = (id) =>
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const remove = (id) => setItems(items.filter((i) => i.id !== id));

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingName(item.name || "");
    setEditingSource(item.source || "");
  };

  const saveEdit = (id) => {
    const nextName = editingName.trim();
    if (!nextName) return;

    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, name: nextName, source: editingSource.trim() }
          : item
      )
    );

    setEditingId(null);
    setEditingName("");
    setEditingSource("");
  };

  const visibleItems = hideCompleted ? items.filter((item) => !item.done) : items;

  return (
    <Card
      className={`rounded-2xl border shadow-lg shadow-black/10 backdrop-blur-[1px] ${
        isDark
          ? "bg-[#16120e] border-[#3e3122]"
          : "bg-[#fff9ef] border-[#d8bc91]"
      }`}
    >
      <CardHeader className="space-y-3">
        <SectionHeader
          icon={Pickaxe}
          title="Items to Farm"
          subtitle="Track gear/components and where you want to farm them."
          isDark={isDark}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ProgressPill done={completed} total={items.length} isDark={isDark} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setHideCompleted((prev) => !prev)}
            className={
              isDark
                ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#d7c19d]"
                : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
            }
          >
            <EyeOff className="h-3.5 w-3.5 mr-1" />
            {hideCompleted ? "Show completed" : "Hide completed"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-5">
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
              Item
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Disruptor Core"
              className={
                isDark
                  ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                  : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
              }
            />
          </div>
          <div className="sm:col-span-5">
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
              Farm Source (optional)
            </Label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={`flex h-9 w-full rounded-md border px-3 py-2 text-sm ${
                isDark
                  ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                  : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
              }`}
            >
              <option value="">Select a farm source...</option>
              {sourceOptions.map((farmSource) => (
                <option key={farmSource} value={farmSource}>
                  {farmSource}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex items-end">
            <Button
              onClick={add}
              className={
                isDark
                  ? "w-full gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]"
                  : "w-full gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
              }
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {visibleItems.map((i) => {
              const editSourceOptions = normalizeFarmSources([...sourceOptions, i.source || ""]);

              return (
                <div
                  key={i.id}
                  className={`flex items-center justify-between rounded-xl border p-3 ${completionRowClass(
                    i.done,
                    isDark
                  )}`}
                >
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    <CheckboxControl
                      checked={i.done}
                      onChange={() => toggle(i.id)}
                      isDark={isDark}
                    />
                    {editingId === i.id ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className={isDark ? "h-8 bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "h-8 bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"}
                        />
                        <select
                          value={editingSource}
                          onChange={(e) => setEditingSource(e.target.value)}
                          className={`h-8 rounded-md border px-3 text-sm ${
                            isDark
                              ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                              : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                          }`}
                        >
                          <option value="">Select a farm source...</option>
                          {editSourceOptions.map((farmSource) => (
                            <option key={farmSource} value={farmSource}>
                              {farmSource}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            i.done ? "line-through" : ""
                          } ${completionTextClass(i.done, isDark)}`}
                        >
                          {i.name}
                        </p>
                        <p
                          className={`text-xs truncate ${completionSubtextClass(
                            i.done,
                            isDark
                          )}`}
                        >
                          {i.source ? `Source: ${i.source}` : "No source added"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {editingId === i.id ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => saveEdit(i.id)} className={isDark ? "text-emerald-300 hover:bg-[#2a2118]" : "text-emerald-700 hover:bg-[#efe1c8]"} title="Save">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                            setEditingSource("");
                          }}
                          className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(i)}
                        className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(i.id)}
                      className={`shrink-0 ${
                        isDark
                          ? "text-[#ccb089] hover:bg-[#2a2118]"
                          : "text-[#7d5c31] hover:bg-[#efe1c8]"
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function LandsraadCard({
  houses,
  setHouses,
  houseSwatches,
  locationEntries,
  isDark,
  trackedOnlyMode,
  setTrackedOnlyMode,
  isMobile,
  onOpenLocationPopup,
}) {
  const [rewardName, setRewardName] = useState("");
  const [requiredAmount, setRequiredAmount] = useState("");
  const [targetHouseId, setTargetHouseId] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [houseSearch, setHouseSearch] = useState("");

  const totalGoals = houses.reduce((acc, h) => acc + h.goals.length, 0);
  const achievedGoals = houses.reduce(
    (acc, h) => acc + h.goals.filter((g) => g.done).length,
    0
  );
  const trackedHousesCount = houses.filter((h) => h.pinned).length;

  const sortedHouses = [...houses].sort((a, b) => {
    if (a.pinned === b.pinned) return a.name.localeCompare(b.name);
    return a.pinned ? -1 : 1;
  });

  const alphabeticalHouses = [...houses].sort((a, b) => a.name.localeCompare(b.name));

  const searchedHouses = sortedHouses.filter((house) =>
    house.name.toLowerCase().includes(houseSearch.trim().toLowerCase())
  );

  const visibleHouses = trackedOnlyMode
    ? searchedHouses.filter((house) => house.pinned)
    : searchedHouses;

  const resetWeek = () => {
    setHouses(
      houses.map((h) => ({
        ...h,
        current: 0,
        goals: [],
      }))
    );
  };

  const togglePinned = (id) =>
    setHouses(houses.map((h) => (h.id === id ? { ...h, pinned: !h.pinned } : h)));

  const updateCurrent = (id, value) => {
    setHouses(
      houses.map((h) =>
        h.id === id
          ? {
              ...h,
              current: value === "" ? "" : coerceHouseCurrent(value),
            }
          : h
      )
    );
  };

  const addGoal = () => {
    const rn = rewardName.trim();
    const req = Number(requiredAmount);
    if (!targetHouseId || !rn || !Number.isFinite(req) || req <= 0) return;
    setHouses(
      houses.map((h) =>
        h.id === targetHouseId
          ? { ...h, goals: [{ id: uid(), name: rn, required: req, done: false }, ...h.goals] }
          : h
      )
    );
    setRewardName("");
    setRequiredAmount("");
  };



  const toggleGoal = (houseId, goalId) => {
    setHouses(
      houses.map((h) =>
        h.id === houseId
          ? { ...h, goals: h.goals.map((g) => (g.id === goalId ? { ...g, done: !g.done } : g)) }
          : h
      )
    );
  };

  const removeGoal = (houseId, goalId) => {
    setHouses(
      houses.map((h) =>
        h.id === houseId ? { ...h, goals: h.goals.filter((g) => g.id !== goalId) } : h
      )
    );
  };

  const trackedRoute = sortedHouses.filter((house) => house.pinned);

  return (
    <div className="space-y-4">
      <Card
        className={`rounded-2xl border shadow-lg shadow-black/10 backdrop-blur-[1px] ${
          isDark ? "bg-[#16120e] border-[#3e3122]" : "bg-[#fff9ef] border-[#d8bc91]"
        }`}
      >
        <CardHeader className="space-y-3">
          <SectionHeader
            icon={Landmark}
            title="Landsraad Operations Console"
            subtitle="Track house progress, add goal descriptions, and command weekly turn-ins."
            isDark={isDark}
          />
          <div className="flex flex-wrap items-center gap-2">
            <ProgressPill done={achievedGoals} total={totalGoals} isDark={isDark} />
            <Badge
              className={
                isDark
                  ? "bg-[#2a2118] text-[#e7d7bc] border border-[#4a3a25]"
                  : "bg-[#efe1c8] text-[#5a4528] border border-[#c9a878]"
              }
            >
              <Clock3 className="h-3.5 w-3.5 mr-1" /> Weekly Cycle Helper
            </Badge>
            <Badge
              className={
                isDark
                  ? "bg-[#243426] text-emerald-200 border border-emerald-700"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-400"
              }
            >
              Tracked Houses: {trackedHousesCount}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
              Search House
            </Label>
            <div className="relative">
              <Search
                className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                  isDark ? "text-[#a79274]" : "text-[#8b6c43]"
                }`}
              />
              <Input
                value={houseSearch}
                onChange={(e) => setHouseSearch(e.target.value)}
                placeholder="Search by house name..."
                className={
                  isDark
                    ? "pl-9 pr-9 bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                    : "pl-9 pr-9 bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                }
              />
              {houseSearch ? (
                <button
                  type="button"
                  aria-label="Clear house search"
                  onClick={() => setHouseSearch("")}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 ${
                    isDark ? "text-[#bfa98a] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-wrap justify-between"}`}>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setTrackedOnlyMode((v) => !v)}
                className={
                  trackedOnlyMode
                    ? isDark
                      ? "border-emerald-400 bg-emerald-900/40 text-emerald-200"
                      : "border-emerald-600 bg-emerald-100 text-emerald-800"
                    : isDark
                      ? "border-[#5a462c] bg-[#211910] text-[#e6d0ac]"
                      : "border-[#c9a878] bg-[#f7ead2] text-[#6d4f27]"
                }
              >
                {trackedOnlyMode ? "Showing Tracked Only" : "Show Tracked Only"}
              </Button>
            </div>

            <Button
              onClick={() => setShowResetConfirm(true)}
              variant="outline"
              className={
                isDark
                  ? "gap-2 border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                  : "gap-2 border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
              }
            >
              <RotateCcw className="h-4 w-4" /> Reset Week (Clear Goals)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-4">
              <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
                Select House
              </Label>
              <select
                value={targetHouseId}
                onChange={(e) => setTargetHouseId(e.target.value)}
                className={`h-10 w-full rounded-md border px-3 text-sm ${
                  isDark
                    ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                    : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                }`}
              >
                <option value="">Select house</option>
                {alphabeticalHouses.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-5">
              <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
                Goal Description
              </Label>
              <Input
                value={rewardName}
                onChange={(e) => setRewardName(e.target.value)}
                placeholder="e.g., Weekly Cache Turn-In"
                className={
                  isDark
                    ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                    : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
                Goal Value
              </Label>
              <Input
                type="number"
                min={1}
                value={requiredAmount}
                onChange={(e) => setRequiredAmount(e.target.value)}
                placeholder="5000"
                className={
                  isDark
                    ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                    : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                }
              />
            </div>

            <div className="md:col-span-1 flex items-end">
              <Button
                onClick={addGoal}
                className={
                  isDark
                    ? "w-full gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]"
                    : "w-full gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
                }
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          {isMobile && (
            <div className="space-y-3 pr-1">
              {visibleHouses.map((h) => {
                const doneCount = h.goals.filter((g) => g.done).length;
                const houseSwatchEarned = hasEarnedHouseSwatch(h.name, houseSwatches);

                return (
                  <div
                    key={h.id}
                    className={`rounded-xl border p-3 space-y-3 ${
                      isDark ? "bg-[#1a140f] border-[#3b2d1f]" : "bg-[#fffaf0] border-[#dcc39b]"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <Shield
                          className={`h-4 w-4 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                        />
                        <p
                          className={`font-semibold truncate ${
                            isDark ? "text-[#f2e7d5]" : "text-[#3f2f1a]"
                          }`}
                        >
                          {h.name}
                        </p>

                        {h.pinned && (
                          <Badge
                            className={
                              isDark
                                ? "bg-[#2b3f2e] text-[#bcf0c9] border border-emerald-600"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-500"
                            }
                          >
                            Tracked
                          </Badge>
                        )}

                        <Badge
                          className={
                            isDark
                              ? "bg-[#2a2118] text-[#e7d7bc] border border-[#4a3a25]"
                              : "bg-[#efe1c8] text-[#5a4528] border border-[#c9a878]"
                          }
                        >
                          Goals: {doneCount}/{h.goals.length}
                        </Badge>

                        <Badge
                          className={
                            isDark
                              ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-400"
                          }
                        >
                          Map: {houseMapLabel(h.name, locationEntries)}
                        </Badge>

                        <Badge
                          className={
                            houseSwatchEarned
                              ? isDark
                                ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-400"
                              : isDark
                                ? "bg-[#3a2a1b] text-[#e7d7bc] border border-[#5f482e]"
                                : "bg-[#f6ead4] text-[#6e5331] border border-[#d6b181]"
                          }
                        >
                          {houseSwatchEarned
                            ? "House Swatch Earned"
                            : "House Swatch Not Yet Earned"}
                        </Badge>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => onOpenLocationPopup(h.name)}
                          className={`inline-flex items-center rounded-md h-7 px-2 text-sm transition-colors cursor-pointer underline-offset-2 hover:underline ${
                            isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"
                          }`}
                        >
                          View location
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePinned(h.id)}
                          className={`border ${
                            h.pinned
                              ? isDark
                                ? "border-emerald-400 bg-emerald-900/40 text-emerald-200 hover:bg-emerald-800/50"
                                : "border-emerald-600 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : isDark
                                ? "border-[#5a462c] bg-[#1f1710] text-[#e6d0ac] hover:bg-[#2a2118]"
                                : "border-[#c9a878] bg-[#f7ead2] text-[#7d5c31] hover:bg-[#efe1c8]"
                          }`}
                        >
                          {h.pinned ? "Tracked" : "Track"}
                        </Button>

                        <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
                          Current
                        </Label>

                        <Input
                          type="number"
                          min={0}
                          value={h.current}
                          onChange={(e) => updateCurrent(h.id, e.target.value)}
                          className={`w-24 h-8 ${
                            isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                          }`}
                        />

                      </div>
                    </div>

                    <div className="space-y-2">
                      {h.goals.map((g) => {
                        const currentAmount = Number(h.current) || 0;
                        const remaining = Math.max(g.required - currentAmount, 0);
                        const projectedPct = g.required > 0 ? Math.min(100, Math.round((currentAmount / g.required) * 100)) : 0;

                        return (
                          <div
                            key={g.id}
                            className={`flex items-center justify-between rounded-lg border p-2 ${completionRowClass(
                              g.done,
                              isDark
                            )}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckboxControl
                                checked={g.done}
                                onChange={() => toggleGoal(h.id, g.id)}
                                isDark={isDark}
                              />
                              <Trophy
                                className={`h-4 w-4 ${
                                  g.done
                                    ? isDark
                                      ? "text-emerald-400"
                                      : "text-emerald-700"
                                    : isDark
                                      ? "text-[#d5b277]"
                                      : "text-[#8a632f]"
                                }`}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`text-sm truncate ${
                                      g.done ? "line-through" : ""
                                    } ${completionTextClass(g.done, isDark)}`}
                                  >
                                    {g.name}
                                  </p>
                                  {g.done && (
                                    <Badge
                                      className={
                                        isDark
                                          ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
                                          : "bg-emerald-100 text-emerald-800 border border-emerald-400"
                                      }
                                    >
                                      Turned in
                                    </Badge>
                                  )}
                                </div>
                                <p className={`text-xs ${completionSubtextClass(g.done, isDark)}`}>
                                  Requires: {g.required.toLocaleString()} • Remaining: {remaining.toLocaleString()} • Projection: {projectedPct}%
                                </p>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGoal(h.id, g.id)}
                              className={
                                isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}

                      {h.goals.length === 0 && (
                        <div
                          className={`rounded-lg border border-dashed p-3 text-xs ${
                            isDark
                              ? "border-[#4a3a25] text-[#a79274]"
                              : "border-[#caa779] text-[#7a6342]"
                          }`}
                        >
                          No reward goals yet for this house.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {visibleHouses.length === 0 ? (
                <div
                  className={`rounded-lg border border-dashed p-3 text-xs ${
                    isDark
                      ? "border-[#4a3a25] text-[#a79274]"
                      : "border-[#caa779] text-[#7a6342]"
                  }`}
                >
                  No houses match the current filter/search.
                </div>
              ) : null}
            </div>
          )}

          {!isMobile && (
            <ScrollArea className="h-[calc(100vh-17rem)] min-h-[620px] pr-2">
              <div className="space-y-3">
                {visibleHouses.map((h) => {
                  const doneCount = h.goals.filter((g) => g.done).length;
                  const houseSwatchEarned = hasEarnedHouseSwatch(h.name, houseSwatches);

                  return (
                    <div
                      key={h.id}
                      className={`rounded-xl border p-3 space-y-3 ${
                        isDark ? "bg-[#1a140f] border-[#3b2d1f]" : "bg-[#fffaf0] border-[#dcc39b]"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <Shield
                            className={`h-4 w-4 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                          />
                          <p
                            className={`font-semibold truncate ${
                              isDark ? "text-[#f2e7d5]" : "text-[#3f2f1a]"
                            }`}
                          >
                            {h.name}
                          </p>

                          {h.pinned && (
                            <Badge
                              className={
                                isDark
                                  ? "bg-[#2b3f2e] text-[#bcf0c9] border border-emerald-600"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-500"
                              }
                            >
                              Tracked
                            </Badge>
                          )}

                          <Badge
                            className={
                              isDark
                                ? "bg-[#2a2118] text-[#e7d7bc] border border-[#4a3a25]"
                                : "bg-[#efe1c8] text-[#5a4528] border border-[#c9a878]"
                            }
                          >
                            Goals: {doneCount}/{h.goals.length}
                          </Badge>

                          <Badge
                            className={
                              isDark
                                ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-400"
                            }
                          >
                            Map: {houseMapLabel(h.name, locationEntries)}
                          </Badge>

                          <Badge
                            className={
                              houseSwatchEarned
                                ? isDark
                                  ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-400"
                                : isDark
                                  ? "bg-[#3a2a1b] text-[#e7d7bc] border border-[#5f482e]"
                                  : "bg-[#f6ead4] text-[#6e5331] border border-[#d6b181]"
                            }
                          >
                            {houseSwatchEarned
                              ? "House Swatch Earned"
                              : "House Swatch Not Yet Earned"}
                          </Badge>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenLocationPopup(h.name)}
                            className={`inline-flex items-center rounded-md h-7 px-2 text-sm transition-colors cursor-pointer underline-offset-2 hover:underline ${
                              isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"
                            }`}
                          >
                            View location
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePinned(h.id)}
                            className={`border ${
                              h.pinned
                                ? isDark
                                  ? "border-emerald-400 bg-emerald-900/40 text-emerald-200 hover:bg-emerald-800/50"
                                  : "border-emerald-600 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : isDark
                                  ? "border-[#5a462c] bg-[#1f1710] text-[#e6d0ac] hover:bg-[#2a2118]"
                                  : "border-[#c9a878] bg-[#f7ead2] text-[#7d5c31] hover:bg-[#efe1c8]"
                            }`}
                          >
                            {h.pinned ? "Tracked" : "Track"}
                          </Button>

                          <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
                            Current
                          </Label>

                          <Input
                            type="number"
                            min={0}
                            value={h.current}
                            onChange={(e) => updateCurrent(h.id, e.target.value)}
                            className={`w-24 h-8 ${
                              isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                            }`}
                          />

                        </div>
                      </div>

                      <div className="space-y-2">
                        {h.goals.map((g) => {
                          const currentAmount = Number(h.current) || 0;
                          const remaining = Math.max(g.required - currentAmount, 0);
                          const projectedPct = g.required > 0 ? Math.min(100, Math.round((currentAmount / g.required) * 100)) : 0;

                          return (
                            <div
                              key={g.id}
                              className={`flex items-center justify-between rounded-lg border p-2 ${completionRowClass(
                                g.done,
                                isDark
                              )}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckboxControl
                                  checked={g.done}
                                  onChange={() => toggleGoal(h.id, g.id)}
                                  isDark={isDark}
                                />
                                <Trophy
                                  className={`h-4 w-4 ${
                                    g.done
                                      ? isDark
                                        ? "text-emerald-400"
                                        : "text-emerald-700"
                                      : isDark
                                        ? "text-[#d5b277]"
                                        : "text-[#8a632f]"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p
                                      className={`text-sm truncate ${
                                        g.done ? "line-through" : ""
                                      } ${completionTextClass(g.done, isDark)}`}
                                    >
                                      {g.name}
                                    </p>
                                    {g.done && (
                                      <Badge
                                        className={
                                          isDark
                                            ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
                                            : "bg-emerald-100 text-emerald-800 border border-emerald-400"
                                        }
                                      >
                                        Turned in
                                      </Badge>
                                    )}
                                  </div>
                                  <p className={`text-xs ${completionSubtextClass(g.done, isDark)}`}>
                                    Requires: {g.required.toLocaleString()} • Remaining: {remaining.toLocaleString()} • Projection: {projectedPct}%
                                  </p>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeGoal(h.id, g.id)}
                                className={
                                  isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}

                        {h.goals.length === 0 && (
                          <div
                            className={`rounded-lg border border-dashed p-3 text-xs ${
                              isDark
                                ? "border-[#4a3a25] text-[#a79274]"
                                : "border-[#caa779] text-[#7a6342]"
                            }`}
                          >
                            No reward goals yet for this house.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {visibleHouses.length === 0 ? (
                  <div
                    className={`rounded-lg border border-dashed p-3 text-xs ${
                      isDark
                        ? "border-[#4a3a25] text-[#a79274]"
                        : "border-[#caa779] text-[#7a6342]"
                    }`}
                  >
                    No houses match the current filter.
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
              isDark ? "bg-[#1a140f] border-[#5a452a] text-[#f2e7d5]" : "bg-[#fff8ec] border-[#c9a878] text-[#3a2b17]"
            }`}
          >
            <h3 className="text-base font-semibold">Reset Landsraad progress for the week?</h3>
            <p className={`mt-2 text-sm ${isDark ? "text-[#d8c3a1]" : "text-[#6b5636]"}`}>
              This will clear all house progress and remove any reward goals you manually entered.
            </p>
            <p className={`mt-1 text-xs ${isDark ? "text-[#a79274]" : "text-[#7a6342]"}`}>
              This action cannot be undone.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowResetConfirm(false)}
                className={
                  isDark
                    ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                    : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
                }
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  resetWeek();
                  setShowResetConfirm(false);
                }}
                className={
                  isDark
                    ? "bg-[#b26e2b] hover:bg-[#ca7b31] text-[#1a1208]"
                    : "bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
                }
              >
                Accept Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HouseSwatchesCard({ swatches, setSwatches, isDark }) {
  const [swatchText, setSwatchText] = useState("");
  const [swatchSearch, setSwatchSearch] = useState("");
  const [swatchFilterMode, setSwatchFilterMode] = useState("all");

  const addSwatch = () => {
    const text = swatchText.trim();
    if (!text) return;
    setSwatches([{ id: uid(), text, done: false }, ...swatches]);
    setSwatchText("");
  };

  const toggleSwatch = (id) =>
    setSwatches(swatches.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));

  const removeSwatch = (id) => setSwatches(swatches.filter((s) => s.id !== id));

  const searchedSwatches = swatches.filter((swatch) =>
    swatch.text.toLowerCase().includes(swatchSearch.trim().toLowerCase())
  );

  const visibleSwatches = searchedSwatches.filter((swatch) => {
    if (swatchFilterMode === "earned") return swatch.done;
    if (swatchFilterMode === "not-earned") return !swatch.done;
    return true;
  });

  return (
    <Card
      className={`rounded-2xl border shadow-lg shadow-black/10 backdrop-blur-[1px] ${
        isDark
          ? "bg-[#16120e] border-[#3e3122]"
          : "bg-[#fff9ef] border-[#d8bc91]"
      }`}
    >
      <CardHeader className="space-y-3">
        <SectionHeader
          icon={Shield}
          title="House Swatches Earned"
          subtitle="Track swatches you've unlocked."
          isDark={isDark}
        />
        <ProgressPill
          done={swatches.filter((s) => s.done).length}
          total={swatches.length}
          isDark={isDark}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={swatchText}
            onChange={(e) => setSwatchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSwatch()}
            placeholder="e.g., Atreides Desert Camo"
            className={
              isDark
                ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7] placeholder:text-[#a79274]"
                : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
            }
          />
          <Button
            onClick={addSwatch}
            className={
              isDark
                ? "gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]"
                : "gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
            }
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        <div className="relative">
          <Search
            className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
              isDark ? "text-[#a79274]" : "text-[#8b6c43]"
            }`}
          />
          <Input
            value={swatchSearch}
            onChange={(e) => setSwatchSearch(e.target.value)}
            placeholder="Search swatches..."
            className={
              isDark
                ? "pl-9 pr-9 bg-[#201911] border-[#4a3a25] text-[#f2e8d7] placeholder:text-[#a79274]"
                : "pl-9 pr-9 bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
            }
          />
          {swatchSearch ? (
            <button
              type="button"
              aria-label="Clear swatch search"
              onClick={() => setSwatchSearch("")}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 ${
                isDark ? "text-[#bfa98a] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"
              }`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setSwatchFilterMode((mode) => (mode === "not-earned" ? "all" : "not-earned"))
            }
            className={
              swatchFilterMode === "not-earned"
                ? isDark
                  ? "border-emerald-500 bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/40"
                  : "border-emerald-600 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : isDark
                  ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                  : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
            }
          >
            Show not earned
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setSwatchFilterMode((mode) => (mode === "earned" ? "all" : "earned"))
            }
            className={
              swatchFilterMode === "earned"
                ? isDark
                  ? "border-emerald-500 bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/40"
                  : "border-emerald-600 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : isDark
                  ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                  : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
            }
          >
            Only show earned
          </Button>
        </div>

        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {visibleSwatches.map((s) => {
              const isCustomSwatch = !isDefaultHouseSwatchText(s.text);

              return (
              <div
                key={s.id}
                className={`flex items-center justify-between rounded-xl border p-3 ${completionRowClass(
                  s.done,
                  isDark
                )}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckboxControl
                    checked={s.done}
                    onChange={() => toggleSwatch(s.id)}
                    isDark={isDark}
                  />
                  {s.done ? (
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${
                        isDark ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    />
                  ) : null}
                  <p
                    className={`text-sm truncate ${s.done ? "font-semibold" : ""} ${completionTextClass(
                      s.done,
                      isDark
                    )}`}
                  >
                    {s.text}
                  </p>
                  {s.done ? (
                    <Badge
                      className={
                        isDark
                          ? "bg-emerald-900/40 text-emerald-200 border border-emerald-700"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-400"
                      }
                    >
                      Collected
                    </Badge>
                  ) : null}
                </div>
                {isCustomSwatch ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSwatch(s.id)}
                    className={
                      isDark
                        ? "text-[#ccb089] hover:bg-[#2a2118]"
                        : "text-[#7d5c31] hover:bg-[#efe1c8]"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Badge
                    variant="secondary"
                    className={
                      isDark
                        ? "bg-[#2a2118] text-[#b8a58a] border border-[#4a3a25]"
                        : "bg-[#efe1c8] text-[#7b6342] border border-[#d8bc91]"
                    }
                  >
                    Landsraad reward
                  </Badge>
                )}
              </div>
              );
            })}
            {visibleSwatches.length === 0 ? (
              <div
                className={`rounded-xl border p-3 text-sm ${
                  isDark
                    ? "border-[#3f3124] bg-[#1b1510] text-[#c8bca7]"
                    : "border-[#d8bc91] bg-[#fff7e8] text-[#6b5636]"
                }`}
              >
                No swatches match the current filter/search.
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


function DuneToolsCard({ isDark, isAdmin, tools, setTools }) {
  const [nameInput, setNameInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [showAdminControls, setShowAdminControls] = useState(false);

  const addTool = () => {
    const name = nameInput.trim();
    const url = urlInput.trim();
    const notes = notesInput.trim();
    if (!name || !url) return;

    setTools((prev) => [...prev, { id: uid(), name, url, notes }]);
    setNameInput("");
    setUrlInput("");
    setNotesInput("");
  };

  const removeTool = (id) => {
    setTools((prev) => prev.filter((tool) => tool.id !== id));
  };

  return (
    <Card className={`rounded-2xl border ${isDark ? "bg-[#17120d] border-[#4a3a25]" : "bg-[#fff9ef] border-[#d8bc91]"}`}>
      <CardHeader>
        <SectionHeader
          icon={Wrench}
          title="Dune Tools"
          subtitle="Shared links for useful Dune Awakening resources."
          isDark={isDark}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {tools.map((tool) => (
            <div key={tool.id} className={`rounded-xl border p-3 ${isDark ? "border-[#3f3124] bg-[#1b1510]" : "border-[#d8bc91] bg-[#fff7e8]"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{tool.name}</p>
                  <a href={tool.url} target="_blank" rel="noreferrer" className={`mt-1 inline-flex items-center gap-1 text-xs underline ${isDark ? "text-[#d9c6a6]" : "text-[#7a4e1e]"}`}>
                    Open link <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {isAdmin && showAdminControls ? (
                  <Button variant="ghost" size="icon" onClick={() => removeTool(tool.id)} className={isDark ? "text-[#ccb089] hover:bg-[#2a2118]" : "text-[#7d5c31] hover:bg-[#efe1c8]"}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              {tool.notes ? <p className={`mt-2 text-xs ${isDark ? "text-[#b9a383]" : "text-[#6b5636]"}`}>{tool.notes}</p> : null}
            </div>
          ))}
        </div>
        {isAdmin ? (
          <div className="space-y-3 pt-2">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdminControls((prev) => !prev)}
                className={
                  isDark
                    ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                    : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
                }
              >
                {showAdminControls ? "Hide Admin Controls" : "Show Admin Controls"}
              </Button>
            </div>
            {showAdminControls ? (
              <div className={`rounded-xl border p-3 space-y-2 ${isDark ? "border-[#4a3a25] bg-[#211910]" : "border-[#d8bc91] bg-[#fff3df]"}`}>
                <p className={`text-xs ${isDark ? "text-[#c8bca7]" : "text-[#7a6342]"}`}>
                  Admin mode: Add, remove, and annotate tools for everyone.
                </p>
                <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Tool name" className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
                <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." className={isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"} />
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={2}
                  placeholder="Quick notes"
                  className={`w-full rounded-md border px-3 py-2 text-sm ${isDark ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]" : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"}`}
                />
                <Button onClick={addTool} className={isDark ? "gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]" : "gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"}>
                  <Plus className="h-4 w-4" /> Add Tool
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AuthGate({ onSignedIn, isDark, isAtreides, isSpice }) {
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
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 ${
        isDark
          ? "bg-[radial-gradient(1100px_520px_at_12%_8%,_#3e2748_0%,_transparent_58%),radial-gradient(900px_440px_at_88%_18%,_#4a1e28_0%,_transparent_62%),radial-gradient(700px_360px_at_50%_115%,_#2a2f5e_0%,_transparent_68%),linear-gradient(170deg,_#1b1319_0%,_#110d12_48%,_#0b090d_100%)] text-[#f2e7d5]"
          : isAtreides
            ? "bg-[radial-gradient(920px_420px_at_16%_10%,_#95b09a_0%,_transparent_62%),radial-gradient(780px_420px_at_82%_20%,_#7c9f86_0%,_transparent_66%),linear-gradient(165deg,_#213a2f_0%,_#1b3128_46%,_#162920_100%)] text-[#e1efe6]"
            : isSpice
              ? "bg-[radial-gradient(900px_420px_at_18%_8%,_#c79ce8_0%,_transparent_62%),radial-gradient(900px_420px_at_84%_20%,_#a97ad8_0%,_transparent_66%),linear-gradient(165deg,_#d4b88f_0%,_#c8a674_50%,_#ba9662_100%)] text-[#311e45]"
              : "bg-[radial-gradient(900px_440px_at_20%_6%,_#cfb5ef_0%,_transparent_62%),radial-gradient(1200px_500px_at_15%_8%,_#fff0cd_0%,_#f6e3c0_35%,_transparent_70%),radial-gradient(900px_420px_at_85%_22%,_#efd5a6_0%,_#e4c38d_40%,_transparent_72%),linear-gradient(165deg,_#f8e8c9_0%,_#edd7b2_44%,_#dcc08f_100%)] text-[#3a2b17]"
      } ${isAtreides ? "theme-atreides" : isSpice ? "theme-spice" : ""}`}
    >
      <Card
        className={`w-full max-w-md rounded-2xl border ${
          isDark
            ? "bg-[#16120e] border-[#3e3122]"
            : "bg-[#fff9ef] border-[#d8bc91]"
        }`}
      >
        <CardHeader className="space-y-2">
          <SectionHeader
            icon={UserCircle2}
            title="Sign in to your companion"
            subtitle="Each account has its own backend-saved data."
            isDark={isDark}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === "signin" ? "default" : "outline"}
              onClick={() => setMode("signin")}
              className={
                mode === "signin"
                  ? isDark
                    ? "bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]"
                    : "bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
                  : ""
              }
            >
              Sign In
            </Button>
            <Button
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => setMode("signup")}
              className={
                mode === "signup"
                  ? isDark
                    ? "bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]"
                    : "bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
                  : ""
              }
            >
              Create Account
            </Button>
          </div>

          <div>
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={
                isDark
                  ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                  : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
              }
            />
          </div>

          <div>
            <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
              Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="At least 6 characters"
              className={
                isDark
                  ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                  : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
              }
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={busy}
            className={
              isDark
                ? "w-full bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]"
                : "w-full bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
            }
          >
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>

          {msg ? (
            <p className={`text-xs ${isDark ? "text-[#d8c3a1]" : "text-[#6d4f27]"}`}>
              {msg}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  const fileInputRef = useRef(null);
  const isMobile = useIsMobile();

  const defaults = makeDefaultState();

  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);

  const [hydrated, setHydrated] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);

  const [themeMode, setThemeMode] = useState(defaults.themeMode);
  const [sessionTodos, setSessionTodos] = useState(defaults.sessionTodos);
  const [materials, setMaterials] = useState(defaults.materials);
  const [farmItems, setFarmItems] = useState(defaults.farmItems);
  const [farmSources, setFarmSources] = useState(defaults.farmSources);
  const [generalTodos, setGeneralTodos] = useState(defaults.generalTodos);
  const [landsraadHouses, setLandsraadHouses] = useState(defaults.landsraadHouses);
  const [houseSwatches, setHouseSwatches] = useState(defaults.houseSwatches);
  const [trackedOnlyMode, setTrackedOnlyMode] = useState(defaults.trackedOnlyMode);
  const [duneTools, setDuneTools] = useState(defaults.duneTools);
  const [activeTab, setActiveTab] = useState("landsraad");
  const [lastCloudSaveAt, setLastCloudSaveAt] = useState(null);
  const [lastCloudError, setLastCloudError] = useState(null);
  const [sharedTodosReady, setSharedTodosReady] = useState(false);
  const [lastSharedTodosError, setLastSharedTodosError] = useState(null);
  const [showChangeNotes, setShowChangeNotes] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [selectedLocationHouse, setSelectedLocationHouse] = useState(ALL_LANDSRAAD_HOUSES[0]);
  const [showLocationAdmin, setShowLocationAdmin] = useState(false);
  const [locationEntries, setLocationEntries] = useState(makeDefaultHouseLocationEntries());
  const [locationEntriesReady, setLocationEntriesReady] = useState(false);
  const [locationEntriesError, setLocationEntriesError] = useState(null);
  const [locationUploadStateByHouse, setLocationUploadStateByHouse] = useState({});
  const [farmSourceInput, setFarmSourceInput] = useState("");
  const [weeklyResetCountdown, setWeeklyResetCountdown] = useState(() =>
    getTimeUntilNextTuesdayMidnightEt()
  );
  const [nextWeeklyResetAtIso, setNextWeeklyResetAtIso] = useState(() =>
    getNextTuesdayMidnightEt().toISOString()
  );
  const [forceResetWarningMode, setForceResetWarningMode] = useState(false);
  const [showResetWarningPopup, setShowResetWarningPopup] = useState(false);
  const [dismissResetWarningForWeek, setDismissResetWarningForWeek] = useState(false);
  const isDark = themeMode === "dark";
  const isAtreides = themeMode === "atreides";
  const isSpice = themeMode === "spice";
  const isAdmin = (session?.user?.email || "").toLowerCase() === ADMIN_EMAIL;
  const isResetWarningWindow = forceResetWarningMode || weeklyResetCountdown <= DAY_IN_MS;

  // Auth bootstrap
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

  // localStorage hydrate
  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const saved = raw ? safeParse(raw, null) : null;
    const sharedTodosCacheRaw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(SHARED_TODOS_CACHE_KEY)
        : null;
    const sharedTodosCache = sharedTodosCacheRaw ? safeParse(sharedTodosCacheRaw, null) : null;

    if (saved && typeof saved === "object") {
      if (typeof saved.themeMode === "string") {
        setThemeMode(saved.themeMode);
      } else if (typeof saved.isDark === "boolean") {
        setThemeMode(saved.isDark ? "dark" : "light");
      }
      if (Array.isArray(saved.sessionTodos)) setSessionTodos(saved.sessionTodos);
      if (Array.isArray(saved.materials)) setMaterials(saved.materials);
      if (Array.isArray(saved.farmItems)) setFarmItems(saved.farmItems);
      if (Array.isArray(saved.farmSources)) setFarmSources(normalizeFarmSources(saved.farmSources));
      if (Array.isArray(saved.generalTodos)) setGeneralTodos(saved.generalTodos);
      if (Array.isArray(saved.landsraadHouses)) {
        setLandsraadHouses(normalizeLandsraadHouses(saved.landsraadHouses));
      }
      if (Array.isArray(saved.houseSwatches)) setHouseSwatches(normalizeHouseSwatches(saved.houseSwatches));
      if (typeof saved.trackedOnlyMode === "boolean") setTrackedOnlyMode(saved.trackedOnlyMode);
      if (Array.isArray(saved.duneTools)) setDuneTools(normalizeDuneTools(saved.duneTools));
    }

    if (Array.isArray(sharedTodosCache)) {
      setSessionTodos(sharedTodosCache);
    }

    setHydrated(true);
  }, []);

  // cloud load once signed in
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
          if (typeof s.themeMode === "string") {
            setThemeMode(s.themeMode);
          } else if (typeof s.isDark === "boolean") {
            setThemeMode(s.isDark ? "dark" : "light");
          }
          if (Array.isArray(s.materials)) setMaterials(s.materials);
          if (Array.isArray(s.farmItems)) setFarmItems(s.farmItems);
          if (Array.isArray(s.farmSources)) setFarmSources(normalizeFarmSources(s.farmSources));
          if (Array.isArray(s.generalTodos)) setGeneralTodos(s.generalTodos);
          if (Array.isArray(s.landsraadHouses)) {
            setLandsraadHouses(normalizeLandsraadHouses(s.landsraadHouses));
          }
          if (Array.isArray(s.houseSwatches)) setHouseSwatches(normalizeHouseSwatches(s.houseSwatches));
          if (typeof s.trackedOnlyMode === "boolean") setTrackedOnlyMode(s.trackedOnlyMode);
        } else {
          // Seed first cloud row with current local state
          await supabase.from("user_app_state").upsert({
            user_id: session.user.id,
            state: {
              isDark,
              themeMode,
              materials,
              farmItems,
              farmSources,
              generalTodos,
              landsraadHouses,
              houseSwatches,
              trackedOnlyMode,
            },
            updated_at: new Date().toISOString(),
          });
        }

        setCloudReady(true);
        setLastCloudError(null);
      } catch (e) {
        console.error("Cloud load failed:", e?.message || e);
        setCloudReady(true); // allow app usage even if cloud fails
        setLastCloudError(e?.message || "Cloud load failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, hydrated]);

  // shared to-do load (all users)
  useEffect(() => {
    if (!session?.user?.id || !hydrated) return;

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("shared_todos")
          .select("todos")
          .eq("key", "global")
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        if (Array.isArray(data?.todos)) {
          setSessionTodos(data.todos);
        } else {
          await supabase.from("shared_todos").upsert(
            {
              key: "global",
              todos: sessionTodos,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );
        }

        setSharedTodosReady(true);
        setLastSharedTodosError(null);
      } catch (e) {
        console.error("Shared to-do sync failed:", e?.message || e);
        setSharedTodosReady(true);
        setLastSharedTodosError(e?.message || "Shared to-do sync failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, hydrated]);

  // landsraad location popup content load (all users)
  useEffect(() => {
    if (!session?.user?.id || !hydrated) return;

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("landsraad_location_content")
          .select("entries,farm_sources,dune_tools")
          .eq("key", LOCATION_CONTENT_KEY)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        if (data?.entries && typeof data.entries === "object") {
          setLocationEntries(normalizeHouseLocationEntries(data.entries));
          setFarmSources(normalizeFarmSources(data.farm_sources));
          setDuneTools(normalizeDuneTools(data.dune_tools));
        } else {
          const seededEntries = makeDefaultHouseLocationEntries();
          const seededFarmSources = normalizeFarmSources(defaults.farmSources);
          const seededDuneTools = normalizeDuneTools(defaults.duneTools);
          await supabase.from("landsraad_location_content").upsert(
            {
              key: LOCATION_CONTENT_KEY,
              entries: seededEntries,
              farm_sources: seededFarmSources,
              dune_tools: seededDuneTools,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );
          setLocationEntries(seededEntries);
          setFarmSources(seededFarmSources);
          setDuneTools(seededDuneTools);
        }

        setLocationEntriesReady(true);
        setLocationEntriesError(null);
      } catch (e) {
        console.error("Landsraad location content load failed:", e?.message || e);
        setLocationEntriesReady(true);
        setLocationEntriesError(e?.message || "Location content load failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, hydrated]);

  // local autosave fallback
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isDark,
        themeMode,
        materials,
        farmItems,
        farmSources,
        generalTodos,
        landsraadHouses,
        houseSwatches,
        trackedOnlyMode,
        duneTools,
      })
    );
  }, [
    hydrated,
    isDark,
    themeMode,
    materials,
    farmItems,
    farmSources,
    generalTodos,
    landsraadHouses,
    houseSwatches,
    trackedOnlyMode,
    duneTools,
  ]);

  // local cache for shared to-do fallback/migration
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    window.localStorage.setItem(SHARED_TODOS_CACHE_KEY, JSON.stringify(sessionTodos));
  }, [hydrated, sessionTodos]);

  useEffect(() => {
    const syncResetCountdown = () => {
      const now = new Date();
      setWeeklyResetCountdown(getTimeUntilNextTuesdayMidnightEt(now));
      setNextWeeklyResetAtIso(getNextTuesdayMidnightEt(now).toISOString());
    };

    syncResetCountdown();
    const interval = setInterval(syncResetCountdown, 1000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const userId = session?.user?.id;

    if (!hydrated || !userId || !nextWeeklyResetAtIso) {
      setShowResetWarningPopup(false);
      setDismissResetWarningForWeek(false);
      return;
    }

    const isDismissedForCurrentWeek = isResetWarningDismissedForWeek(userId, nextWeeklyResetAtIso);
    setDismissResetWarningForWeek(isDismissedForCurrentWeek);

    if (!isResetWarningWindow || isDismissedForCurrentWeek) {
      setShowResetWarningPopup(false);
      return;
    }

    setShowResetWarningPopup(true);
  }, [
    hydrated,
    session?.user?.id,
    nextWeeklyResetAtIso,
    isResetWarningWindow,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    setHouseSwatches((prev) => normalizeHouseSwatches(prev));
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setLandsraadHouses((prev) => normalizeLandsraadHouses(prev));
  }, [hydrated]);


  // cloud autosave (debounced)
  useEffect(() => {
    if (!session?.user?.id || !hydrated || !cloudReady) return;

    const t = setTimeout(async () => {
      try {
        setCloudSaving(true);
        await supabase.from("user_app_state").upsert({
          user_id: session.user.id,
          state: {
            isDark,
            themeMode,
            materials,
            farmItems,
            farmSources,
            generalTodos,
            landsraadHouses,
            houseSwatches,
            trackedOnlyMode,
          },
          updated_at: new Date().toISOString(),
        });
        setLastCloudSaveAt(new Date().toISOString());
        setLastCloudError(null);
      } catch (e) {
        console.error("Cloud save failed:", e?.message || e);
        setLastCloudError(e?.message || "Cloud save failed");
      } finally {
        setCloudSaving(false);
      }
    }, 700);

    return () => clearTimeout(t);
  }, [
    session?.user?.id,
    hydrated,
    cloudReady,
    isDark,
    themeMode,
    materials,
    farmItems,
    farmSources,
    generalTodos,
    landsraadHouses,
    houseSwatches,
    trackedOnlyMode,
  ]);

  // shared to-do autosave (debounced)
  useEffect(() => {
    if (!session?.user?.id || !hydrated || !sharedTodosReady) return;

    const t = setTimeout(async () => {
      try {
        await supabase.from("shared_todos").upsert(
          {
            key: "global",
            todos: sessionTodos,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
        setLastSharedTodosError(null);
      } catch (e) {
        console.error("Shared to-do save failed:", e?.message || e);
        setLastSharedTodosError(e?.message || "Shared to-do save failed");
      }
    }, 500);

    return () => clearTimeout(t);
  }, [session?.user?.id, hydrated, sharedTodosReady, sessionTodos]);

  // landsraad location popup content autosave (admin edits)
  useEffect(() => {
    if (!session?.user?.id || !hydrated || !locationEntriesReady) return;

    const t = setTimeout(async () => {
      try {
        await supabase.from("landsraad_location_content").upsert(
          {
            key: LOCATION_CONTENT_KEY,
            entries: locationEntries,
            farm_sources: normalizeFarmSources(farmSources),
            dune_tools: normalizeDuneTools(duneTools),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
        setLocationEntriesError(null);
      } catch (e) {
        console.error("Location content save failed:", e?.message || e);
        setLocationEntriesError(e?.message || "Location content save failed");
      }
    }, 500);

    return () => clearTimeout(t);
  }, [session?.user?.id, hydrated, locationEntriesReady, locationEntries, farmSources, duneTools]);

  const exportBackup = () => {
    if (typeof window === "undefined") return;
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "Dune Awakening: Landsraad Companion",
      data: {
        isDark,
        themeMode,
        materials,
        farmItems,
        farmSources,
        generalTodos,
        landsraadHouses,
        houseSwatches,
        trackedOnlyMode,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
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

      if (typeof d.themeMode === "string") {
        setThemeMode(d.themeMode);
      } else if (typeof d.isDark === "boolean") {
        setThemeMode(d.isDark ? "dark" : "light");
      }
      if (Array.isArray(d.materials)) setMaterials(d.materials);
      if (Array.isArray(d.farmItems)) setFarmItems(d.farmItems);
      if (Array.isArray(d.farmSources)) setFarmSources(normalizeFarmSources(d.farmSources));
      if (Array.isArray(d.generalTodos)) setGeneralTodos(d.generalTodos);
      if (Array.isArray(d.landsraadHouses)) {
        setLandsraadHouses(normalizeLandsraadHouses(d.landsraadHouses));
      }
      if (Array.isArray(d.houseSwatches)) setHouseSwatches(normalizeHouseSwatches(d.houseSwatches));
      if (typeof d.trackedOnlyMode === "boolean") setTrackedOnlyMode(d.trackedOnlyMode);

      window.alert("Backup imported successfully.");
    };
    reader.readAsText(file);
  };

  const openLocationPopupForHouse = (houseName) => {
    setSelectedLocationHouse(houseName);
    setShowLocationPopup(true);
  };

  const updateLocationNotes = (houseName, notes) => {
    setLocationEntries((prev) => ({
      ...prev,
      [houseName]: {
        ...(prev[houseName] || {}),
        notes,
      },
    }));
  };

  const updateLocationMap = (houseName, mapLocation) => {
    if (!MAP_LOCATION_OPTIONS.includes(mapLocation)) return;

    setLocationEntries((prev) => ({
      ...prev,
      [houseName]: {
        ...(prev[houseName] || {}),
        mapLocation,
      },
    }));
  };

  const handleResetWarningWeekDismissalChange = (checked) => {
    const userId = session?.user?.id;
    const nextValue = Boolean(checked);

    setDismissResetWarningForWeek(nextValue);
    setResetWarningDismissedForWeek(userId, nextWeeklyResetAtIso, nextValue);

    if (nextValue) {
      setShowResetWarningPopup(false);
    }
  };

  const addFarmSource = () => {
    const nextSource = farmSourceInput.trim();
    if (!nextSource) return;

    setFarmSources((prev) => normalizeFarmSources([...prev, nextSource]));
    setFarmSourceInput("");
  };

  const removeFarmSource = (sourceToRemove) => {
    setFarmSources((prev) => prev.filter((source) => source !== sourceToRemove));
    setFarmItems((prev) =>
      prev.map((item) =>
        item.source === sourceToRemove ? { ...item, source: "" } : item
      )
    );
  };

  const uploadLocationImage = async (houseName, file) => {
    if (!file || !isAdmin) return;

    const slug = houseName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const path = `${slug}/${Date.now()}.${extension}`;

    setLocationUploadStateByHouse((prev) => ({ ...prev, [houseName]: { uploading: true, error: null } }));

    try {
      const previousPath = locationEntries[houseName]?.storagePath;

      const { error: uploadError } = await supabase.storage
        .from(LOCATION_IMAGES_BUCKET)
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(LOCATION_IMAGES_BUCKET)
        .getPublicUrl(path);

      setLocationEntries((prev) => ({
        ...prev,
        [houseName]: {
          ...(prev[houseName] || {}),
          imageUrl: publicUrlData?.publicUrl || "",
          storagePath: path,
        },
      }));

      if (previousPath && previousPath !== path) {
        await supabase.storage.from(LOCATION_IMAGES_BUCKET).remove([previousPath]);
      }

      setLocationUploadStateByHouse((prev) => ({ ...prev, [houseName]: { uploading: false, error: null } }));
    } catch (e) {
      setLocationUploadStateByHouse((prev) => ({
        ...prev,
        [houseName]: { uploading: false, error: e?.message || "Upload failed" },
      }));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCloudReady(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(900px_400px_at_15%_5%,_#3a2342_0%,_transparent_60%),radial-gradient(700px_300px_at_85%_10%,_#4a1d2a_0%,_transparent_62%),linear-gradient(170deg,_#161016_0%,_#0f0c11_55%,_#0a090c_100%)] text-[#f2e7d5]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!session) {
    return <AuthGate onSignedIn={setSession} isDark={isDark} isAtreides={isAtreides} isSpice={isSpice} />;
  }

  return (
    <div
      className={`min-h-screen w-full transition-colors ${
        isDark
          ? "bg-[radial-gradient(1100px_520px_at_12%_8%,_#3e2748_0%,_transparent_58%),radial-gradient(900px_440px_at_88%_18%,_#4a1e28_0%,_transparent_62%),radial-gradient(700px_360px_at_50%_115%,_#2a2f5e_0%,_transparent_68%),linear-gradient(170deg,_#1b1319_0%,_#110d12_48%,_#0b090d_100%)] text-[#f2e7d5]"
          : isAtreides
            ? "bg-[radial-gradient(980px_420px_at_16%_8%,_#94b09a_0%,_transparent_64%),radial-gradient(900px_420px_at_85%_20%,_#7b9f89_0%,_transparent_66%),linear-gradient(165deg,_#213a2f_0%,_#1b3128_48%,_#162920_100%)] text-[#e1efe6]"
            : isSpice
              ? "bg-[radial-gradient(950px_420px_at_18%_8%,_#cd9ff0_0%,_transparent_64%),radial-gradient(900px_420px_at_85%_20%,_#ab7cd8_0%,_transparent_66%),linear-gradient(165deg,_#d1b389_0%,_#c39f6c_46%,_#b58f59_100%)] text-[#2f1a42]"
              : "bg-[radial-gradient(900px_440px_at_20%_6%,_#cfb5ef_0%,_transparent_62%),radial-gradient(1200px_500px_at_15%_8%,_#fff0cd_0%,_#f6e3c0_35%,_transparent_70%),radial-gradient(900px_420px_at_85%_22%,_#efd5a6_0%,_#e4c38d_40%,_transparent_72%),linear-gradient(165deg,_#f8e8c9_0%,_#edd7b2_44%,_#dcc08f_100%)] text-[#3a2b17]"
      } ${isAtreides ? "theme-atreides" : isSpice ? "theme-spice" : ""}`}
    >
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl border p-6 md:p-8 shadow-xl backdrop-blur-md ${
            isDark
              ? "bg-[#18130e]/85 border-[#5a452a] shadow-[#00000066]"
              : isAtreides
                ? "bg-[#1e352b]/90 border-[#5d8068] shadow-[#13271f88]"
                : isSpice
                  ? "bg-[#dec1ee]/88 border-[#8f69b1] shadow-[#5e3c7f66]"
                  : "bg-[#fff4df]/90 border-[#c9a878] shadow-[#9b7a4555]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                Dune Awakening: Landsraad Companion
              </h1>
              <p className={`text-sm md:text-base max-w-2xl ${isDark ? "text-[#c8bca7]" : isAtreides ? "text-[#bcd1c4]" : isSpice ? "text-[#55356f]" : "text-[#6b5636]"}`}>
                Command center for Great House goals, weekly strategy, and Landsraad cycle planning.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("dune-tools")}
                className={
                  isDark
                    ? "w-fit border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                    : isAtreides
                      ? "w-fit border-[#6b8d76] bg-[#294336] hover:bg-[#355345] text-[#d8ebdf]"
                      : isSpice
                        ? "w-fit border-[#8f69b1] bg-[#d7b5ea] hover:bg-[#c9a0e0] text-[#3f2459]"
                        : "w-fit border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
                }
              >
                <Wrench className="h-4 w-4 mr-2" /> Dune Tools
              </Button>

            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <div className={`text-xs ${isDark ? "text-[#c8bca7]" : isAtreides ? "text-[#c4d8cc]" : isSpice ? "text-[#5d3a79]" : "text-[#6b5636]"}`}>
                Signed in as <span className="font-semibold">{session.user.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setThemeMode((prev) => cycleThemeMode(prev))}
                  className={
                    isDark
                      ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                      : isAtreides
                        ? "border-[#6b8d76] bg-[#294336] hover:bg-[#355345] text-[#d8ebdf]"
                        : isSpice
                          ? "border-[#8f69b1] bg-[#d7b5ea] hover:bg-[#c9a0e0] text-[#3f2459]"
                          : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
                  }
                >
                  {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {isDark ? "Theme: Dark" : isAtreides ? "Theme: Atreides" : isSpice ? "Theme: Spice" : "Theme: Light"}
                </Button>

                <Button
                  variant="outline"
                  onClick={signOut}
                  className={
                    isDark
                      ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                      : isAtreides
                        ? "border-[#6b8d76] bg-[#294336] hover:bg-[#355345] text-[#d8ebdf]"
                        : isSpice
                          ? "border-[#8f69b1] bg-[#d7b5ea] hover:bg-[#c9a0e0] text-[#3f2459]"
                          : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
                  }
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              <div className={`text-xs ${isDark ? "text-[#a79274]" : isAtreides ? "text-[#b6cabc]" : isSpice ? "text-[#654282]" : "text-[#7a6342]"}`}>
                {!cloudReady
                  ? "Initializing cloud sync..."
                  : cloudSaving
                    ? "Saving to cloud..."
                    : "Cloud sync active"}
              </div>
              <div className={`text-[11px] ${isDark ? "text-[#947d5e]" : isAtreides ? "text-[#a8bfb0]" : isSpice ? "text-[#6d458b]" : "text-[#846742]"}`}>
                {lastCloudError
                  ? `Sync issue: ${lastCloudError}`
                  : lastCloudSaveAt
                    ? `Last cloud save: ${new Date(lastCloudSaveAt).toLocaleTimeString()}`
                    : "Awaiting first cloud save..."}
              </div>

              <div
                className={`w-full sm:w-auto rounded-xl border px-3 py-2 text-xs sm:min-w-[220px] ${
                  isResetWarningWindow
                    ? isDark
                      ? "border-rose-500 bg-rose-900/35 text-rose-100 animate-pulse"
                      : isAtreides
                        ? "border-rose-500 bg-rose-200 text-rose-950 animate-pulse"
                        : isSpice
                          ? "border-rose-500 bg-rose-200 text-rose-950 animate-pulse"
                          : "border-rose-500 bg-rose-100 text-rose-950 animate-pulse"
                    : isDark
                      ? "border-[#4a3a25] bg-[#1b1510] text-[#e6d0ac]"
                      : isAtreides
                        ? "border-[#6b8d76] bg-[#294336] text-[#d9ece0]"
                        : isSpice
                          ? "border-[#8f69b1] bg-[#d7b5ea] text-[#3f2459]"
                          : "border-[#c9a878] bg-[#f7ead2] text-[#6d4f27]"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Clock3 className="h-3.5 w-3.5" /> Weekly Reset (Tue 12:00 AM EST)
                  {isResetWarningWindow ? (
                    <Badge className={`border ${isDark ? "border-rose-400/80 bg-rose-500/20 text-rose-100" : "border-rose-500 bg-rose-100 text-rose-900"}`}>Alert</Badge>
                  ) : null}
                </div>
                <div className={`${isResetWarningWindow ? (isDark ? "text-rose-100" : "text-rose-950") : isDark ? "text-[#c8bca7]" : isAtreides ? "text-[#b9cfc0]" : isSpice ? "text-[#5f3e7a]" : "text-[#7a6342]"}`}>
                  {formatCountdown(weeklyResetCountdown)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList
            className={`${
              isMobile
                ? "flex overflow-x-auto whitespace-nowrap"
                : "grid grid-cols-2 md:grid-cols-6"
            } w-full gap-2 h-auto rounded-2xl p-1.5 border shadow-lg backdrop-blur-sm ${
              isDark
                ? "bg-[#18130e]/85 border-[#5a452a] shadow-[#00000066]"
                : isAtreides
                  ? "bg-[#22392e]/95 border-[#5d8068] shadow-[#12261f88]"
                  : isSpice
                    ? "bg-[#dab9eb]/92 border-[#8f69b1] shadow-[#54357466]"
                    : "bg-[#fff3dc]/95 border-[#c9a878] shadow-[#9b7a4555]"
            }`}
          >
            <TabsTrigger value="coop" className={`rounded-xl gap-2 ${isMobile ? "shrink-0" : ""}`}>
              <ListTodo className="h-4 w-4" /> Shared To-Do
            </TabsTrigger>
            <TabsTrigger value="materials" className={`rounded-xl gap-2 ${isMobile ? "shrink-0" : ""}`}>
              <Package className="h-4 w-4" /> Materials
            </TabsTrigger>
            <TabsTrigger value="items" className={`rounded-xl gap-2 ${isMobile ? "shrink-0" : ""}`}>
              <Pickaxe className="h-4 w-4" /> Items to Farm
            </TabsTrigger>
            <TabsTrigger value="landsraad" className={`rounded-xl gap-2 ${isMobile ? "shrink-0" : ""}`}>
              <Landmark className="h-4 w-4" /> Landsraad
            </TabsTrigger>
            <TabsTrigger value="swatches" className={`rounded-xl gap-2 ${isMobile ? "shrink-0" : ""}`}>
              <Shield className="h-4 w-4" /> Swatches
            </TabsTrigger>
            <TabsTrigger value="general" className={`rounded-xl gap-2 ${isMobile ? "shrink-0" : ""}`}>
              <ListTodo className="h-4 w-4" /> General To-Do
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coop">
            <TodoListCard
              title="Shared To-Do"
              description="Shared checklist synced for all users of this site."
              icon={ListTodo}
              items={sessionTodos}
              setItems={setSessionTodos}
              placeholder="e.g., Run Testing Labs in Deep Desert"
              isDark={isDark}
            />
            {lastSharedTodosError ? (
              <p className={`mt-2 text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                Shared To-Do sync warning: {lastSharedTodosError}
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="materials">
            <MaterialsCard materials={materials} setMaterials={setMaterials} isDark={isDark} />
          </TabsContent>

          <TabsContent value="items">
            <ItemsCard items={farmItems} setItems={setFarmItems} farmSources={farmSources} isDark={isDark} />
          </TabsContent>

          <TabsContent value="landsraad">
            <LandsraadCard
              houses={landsraadHouses}
              setHouses={setLandsraadHouses}
              houseSwatches={houseSwatches}
              locationEntries={locationEntries}
              isDark={isDark}
              isMobile={isMobile}
              trackedOnlyMode={trackedOnlyMode}
              setTrackedOnlyMode={setTrackedOnlyMode}
              onOpenLocationPopup={openLocationPopupForHouse}
            />
          </TabsContent>

          <TabsContent value="swatches">
            <HouseSwatchesCard swatches={houseSwatches} setSwatches={setHouseSwatches} isDark={isDark} />
          </TabsContent>

          <TabsContent value="general">
            <TodoListCard
              title="General To-Do"
              description="Anything outside immediate farming runs."
              icon={ListTodo}
              items={generalTodos}
              setItems={setGeneralTodos}
              placeholder="e.g., Clean stash / sort schematics"
              isDark={isDark}
            />
          </TabsContent>

          <TabsContent value="dune-tools">
            <DuneToolsCard isDark={isDark} isAdmin={isAdmin} tools={duneTools} setTools={setDuneTools} />
          </TabsContent>

        </Tabs>
      </div>

      <div className="fixed bottom-3 right-4 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1">
          {isAdmin ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setShowLocationAdmin(true)}
              className={
                isDark
                  ? "h-7 w-7 border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#d7c19d]"
                  : "h-7 w-7 border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
              }
              title="Landsraad location admin"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowChangeNotes(true)}
            className={
              isDark
                ? "h-7 px-2 text-[11px] border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#d7c19d]"
                : "h-7 px-2 text-[11px] border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
            }
          >
            Change Notes
          </Button>
        </div>

        <div
          className={`text-xs font-medium tracking-wide ${
            isDark ? "text-[#8f7652]" : "text-[#7e6440]"
          }`}
        >
          v{APP_VERSION}
        </div>
      </div>

      {showChangeNotes ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border p-4 sm:p-5 max-h-[80vh] overflow-y-auto ${
              isDark
                ? "bg-[#1a140f] border-[#5a452a] text-[#f2e7d5]"
                : "bg-[#fff8ec] border-[#c9a878] text-[#3a2b17]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm sm:text-base font-semibold">Change Notes</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowChangeNotes(false)}
                className={
                  isDark
                    ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                    : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
                }
              >
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {APP_CHANGE_NOTES.slice(0, 10).map((entry) => (
                <div
                  key={entry.version}
                  className={`rounded-lg border p-3 ${
                    isDark ? "border-[#4a3a25] bg-[#211910]" : "border-[#d8bc91] bg-[#fff3df]"
                  }`}
                >
                  <p className="text-sm font-semibold">v{entry.version}</p>
                  <ul className="mt-1 list-disc pl-5 text-xs space-y-1">
                    {entry.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showResetWarningPopup && session?.user?.id ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div
            className={`relative w-full max-w-lg rounded-2xl border p-4 sm:p-5 ${
              isDark
                ? "bg-[#1a140f] border-rose-700/70 text-[#f2e7d5]"
                : isAtreides
                  ? "bg-[#edf6f1] border-rose-500 text-[#183127]"
                  : isSpice
                    ? "bg-[#f9efff] border-rose-500 text-[#3a1d53]"
                    : "bg-[#fff8ec] border-rose-500 text-[#3a2b17]"
            }`}
          >
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setShowResetWarningPopup(false)}
              className={`absolute right-3 top-3 h-7 w-7 ${
                isDark
                  ? "border-rose-700/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200"
                  : "border-rose-400 bg-rose-100 hover:bg-rose-200 text-rose-900"
              }`}
              aria-label="Close reset warning"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 pr-10">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h3 className="text-sm sm:text-base font-semibold">Deep Desert Reset Alert</h3>
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            </div>

            <p className={`mt-3 text-sm leading-relaxed ${isDark ? "text-[#e9d2ce]" : isAtreides ? "text-[#5a1f24]" : isSpice ? "text-[#5f1f44]" : "text-[#5f1f1f]"}`}>
              There is less than 24 hours until the Deep Desert resets. Have you taken down your base and secured all important items?
            </p>

            <div
              className={`mt-4 rounded-lg border p-3 ${
                isDark
                  ? "border-rose-800/70 bg-rose-950/20"
                  : isAtreides
                    ? "border-rose-300 bg-rose-100"
                    : isSpice
                      ? "border-rose-300 bg-rose-100"
                      : "border-rose-300 bg-rose-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={dismissResetWarningForWeek}
                  onCheckedChange={handleResetWarningWeekDismissalChange}
                  className={checkboxClass({ isDark, isAtreides, isSpice, checked: dismissResetWarningForWeek })}
                />
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#f0d8d1]" : isAtreides ? "text-[#5a1f24]" : isSpice ? "text-[#5f1f44]" : "text-[#5f1f1f]"}`}>
                  Do not display for the rest of the week
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showLocationPopup ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setShowLocationPopup(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-3xl rounded-2xl border p-4 sm:p-5 max-h-[85vh] overflow-y-auto ${
              isDark
                ? "bg-[#1a140f] border-[#5a452a] text-[#f2e7d5]"
                : "bg-[#fff8ec] border-[#c9a878] text-[#3a2b17]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm sm:text-base font-semibold">{selectedLocationHouse} Location</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowLocationPopup(false)}
                className={
                  isDark
                    ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                    : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
                }
              >
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <Badge
                className={
                  isDark
                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-400"
                }
              >
                Map: {houseMapLabel(selectedLocationHouse, locationEntries)}
              </Badge>

              {locationEntries[selectedLocationHouse]?.imageUrl ? (
                <img
                  src={locationEntries[selectedLocationHouse].imageUrl}
                  alt={`${selectedLocationHouse} representative location`}
                  className="w-full rounded-xl border border-[#7a6342]/40"
                />
              ) : (
                <div
                  className={`rounded-lg border border-dashed p-5 text-sm ${
                    isDark ? "border-[#4a3a25] text-[#a79274]" : "border-[#caa779] text-[#7a6342]"
                  }`}
                >
                  Under Construction! Coming soon
                </div>
              )}

              {locationEntries[selectedLocationHouse]?.notes ? (
                <p className={`text-sm ${isDark ? "text-[#d9c6a6]" : "text-[#6d4f27]"}`}>
                  {locationEntries[selectedLocationHouse].notes}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showLocationAdmin && isAdmin ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div
            className={`w-full max-w-4xl rounded-2xl border p-4 sm:p-5 max-h-[85vh] overflow-y-auto ${
              isDark
                ? "bg-[#1a140f] border-[#5a452a] text-[#f2e7d5]"
                : "bg-[#fff8ec] border-[#c9a878] text-[#3a2b17]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm sm:text-base font-semibold">Landsraad Location Admin</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowLocationAdmin(false)}
                className={
                  isDark
                    ? "border-[#5a462c] bg-[#211910] hover:bg-[#2a2118] text-[#e6d0ac]"
                    : "border-[#c9a878] bg-[#f7ead2] hover:bg-[#efdfc2] text-[#6d4f27]"
                }
              >
                Close
              </Button>
            </div>

            <p className={`mt-2 text-xs ${isDark ? "text-[#c8bca7]" : "text-[#7a6342]"}`}>
              Upload map screenshots, select map locations, and edit optional popup notes shown in the View Location popup.
            </p>

            <div
              className={`mt-3 rounded-lg border p-3 ${
                isDark ? "border-[#4a3a25] bg-[#211910]" : "border-[#d8bc91] bg-[#fff3df]"
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={forceResetWarningMode}
                  onCheckedChange={(checked) => setForceResetWarningMode(Boolean(checked))}
                  className={checkboxClass(isDark, forceResetWarningMode)}
                />
                <div>
                  <p className="text-sm font-semibold">Test less-than-24-hours reset warning mode</p>
                  <p className={`text-xs mt-1 ${isDark ? "text-[#c8bca7]" : "text-[#7a6342]"}`}>
                    Simulates the final 24-hour countdown state so the red timer and login alert popup can be tested.
                  </p>
                </div>
              </div>
            </div>
            {locationEntriesError ? (
              <p className={`mt-2 text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                Sync warning: {locationEntriesError}
              </p>
            ) : null}

            <div
              className={`mt-4 rounded-lg border p-3 ${
                isDark ? "border-[#4a3a25] bg-[#211910]" : "border-[#d8bc91] bg-[#fff3df]"
              }`}
            >
              <p className="text-sm font-semibold">Farm Source Options</p>
              <p className={`mt-1 text-xs ${isDark ? "text-[#c8bca7]" : "text-[#7a6342]"}`}>
                Add or remove shared Farm Source dropdown values used in Items to Farm.
              </p>
              <div className="mt-2 flex gap-2">
                <Input
                  value={farmSourceInput}
                  onChange={(e) => setFarmSourceInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFarmSource()}
                  placeholder="e.g., Testing Labs"
                  className={
                    isDark
                      ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                      : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                  }
                />
                <Button
                  type="button"
                  onClick={addFarmSource}
                  className={
                    isDark
                      ? "gap-2 bg-[#c48a3a] hover:bg-[#d59a48] text-[#1a1208]"
                      : "gap-2 bg-[#a56b2c] hover:bg-[#8d5821] text-[#fff4de]"
                  }
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {normalizeFarmSources(farmSources).map((source) => (
                  <Badge
                    key={source}
                    className={`flex items-center gap-1 ${
                      isDark
                        ? "bg-[#2a2118] text-[#e7d7bc] border border-[#4a3a25]"
                        : "bg-[#efe1c8] text-[#5a4528] border border-[#c9a878]"
                    }`}
                  >
                    <span>{source}</span>
                    <button
                      type="button"
                      onClick={() => removeFarmSource(source)}
                      className="rounded p-0.5"
                      title={`Remove ${source}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {ALL_LANDSRAAD_HOUSES.map((houseName) => {
                const uploadState = locationUploadStateByHouse[houseName] || {};
                return (
                  <div
                    key={houseName}
                    className={`rounded-lg border p-3 ${
                      isDark ? "border-[#4a3a25] bg-[#211910]" : "border-[#d8bc91] bg-[#fff3df]"
                    }`}
                  >
                    <p className="text-sm font-semibold">{houseName}</p>

                    <div className="mt-2 space-y-2">
                      <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
                        Map location
                      </Label>
                      <select
                        value={houseMapLabel(houseName, locationEntries)}
                        onChange={(e) => updateLocationMap(houseName, e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          isDark
                            ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                            : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                        }`}
                      >
                        {MAP_LOCATION_OPTIONS.map((mapLocation) => (
                          <option key={mapLocation} value={mapLocation}>
                            {mapLocation}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-2 space-y-2">
                      <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
                        Location image
                      </Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadLocationImage(houseName, e.target.files?.[0])}
                        className={
                          isDark
                            ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                            : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                        }
                      />
                      {uploadState.uploading ? (
                        <p className={`text-xs ${isDark ? "text-[#d8c3a1]" : "text-[#6d4f27]"}`}>Uploading...</p>
                      ) : null}
                      {uploadState.error ? (
                        <p className={`text-xs ${isDark ? "text-rose-300" : "text-rose-700"}`}>{uploadState.error}</p>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-2">
                      <Label className={`text-xs ${isDark ? "text-[#ceb89a]" : "text-[#6b5636]"}`}>
                        Popup notes
                      </Label>
                      <textarea
                        value={locationEntries[houseName]?.notes || ""}
                        onChange={(e) => updateLocationNotes(houseName, e.target.value)}
                        rows={3}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          isDark
                            ? "bg-[#201911] border-[#4a3a25] text-[#f2e8d7]"
                            : "bg-[#fffdf7] border-[#d8bc91] text-[#3a2b17]"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
