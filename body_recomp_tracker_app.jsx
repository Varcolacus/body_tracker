import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, LineChart, Line, Cell, LabelList } from "recharts";
import { Plus, Dumbbell, Moon, Scale, Flame, Beef, Download, Upload, Trash2, Save } from "lucide-react";

const STORAGE_KEY = "body-recomp-tracker-v2";
const REST_DAY_MAINTENANCE = 2350;
const TRAINING_ADDON = 280;
const PROTEIN_MIN = 140;
const PROTEIN_MAX = 180;
const FAT_KCAL_PER_KG = 7700;
const NORM_DEFICIT = -400;

const INITIAL_DAYS = [
  { date: "2026-02-13", balance: -135, protein: 150, intake: 2215, training: false },
  { date: "2026-02-14", balance: 947, protein: 115, intake: 3297, training: false },
  { date: "2026-02-15", balance: -913, protein: 115, intake: 1437, training: false },
  { date: "2026-02-16", balance: -616, protein: 115, intake: 1734, training: false },
  { date: "2026-02-17", balance: -830, protein: 110, intake: 1520, training: false },
  { date: "2026-02-18", balance: -555, protein: 150, intake: 1795, training: false },
  { date: "2026-02-19", balance: -235, protein: 120, intake: 2115, training: false },
  { date: "2026-02-20", balance: -555, protein: 150, intake: 1795, training: false },
  { date: "2026-02-21", balance: 190, protein: 155, intake: 2540, training: false },
  { date: "2026-02-22", balance: 1376, protein: 180, intake: 3726, training: false },
  { date: "2026-02-23", balance: -200, protein: 100, intake: 2150, training: false },
  { date: "2026-02-24", balance: -213, protein: 179, intake: 2137, training: false },
  { date: "2026-02-25", balance: 357, protein: 150, intake: 2707, training: false },
  { date: "2026-02-26", balance: -337, protein: 169, intake: 2013, training: false },
  { date: "2026-02-27", balance: -290, protein: 165, intake: 2060, training: false },
  { date: "2026-02-28", balance: 400, protein: 220, intake: 2750, training: false },
  { date: "2026-03-01", balance: -395, protein: 186, intake: 1955, training: false },
  { date: "2026-03-02", balance: -120, protein: 142, intake: 2230, training: false },
  { date: "2026-03-03", balance: -140, protein: 220, intake: 2210, training: false },
  { date: "2026-03-04", balance: -670, protein: 146, intake: 1680, training: false },
  { date: "2026-03-05", balance: -1079.4, protein: 160.85, intake: 1550.6, training: true },
  { date: "2026-03-06", balance: -595, protein: 189, intake: 1755, training: false },
  { date: "2026-03-07", balance: -201, protein: 157, intake: 2149, training: false },
  { date: "2026-03-08", balance: -540, protein: 173, intake: 2090, training: true },
  { date: "2026-03-09", balance: -385, protein: 164, intake: 1965, training: false },
];

const INITIAL_WEIGHTS = [
  { date: "2026-03-04", weight: 72.8 },
  { date: "2026-03-05", weight: 72.3 },
  { date: "2026-03-06", weight: 71.8 },
  { date: "2026-03-07", weight: 72.3 },
  { date: "2026-03-08", weight: 72.3 },
  { date: "2026-03-09", weight: 72.1 },
  { date: "2026-03-10", weight: 72.0 },
];

const DEFAULT_ITEMS = [
  { meal: "breakfast", name: "Chicken breast", grams: 200, kcal100: 165, protein100: 31 },
  { meal: "lunch", name: "Fromage blanc", grams: 100, kcal100: 45, protein100: 8 },
  { meal: "dinner", name: "Apple", grams: 150, kcal100: 52, protein100: 0.3 },
];

const FOOD_LIBRARY = [
  { name: "Chicken breast", kcal100: 165, protein100: 31 },
  { name: "Tuna", kcal100: 117, protein100: 28 },
  { name: "Ham", kcal100: 198, protein100: 33 },
  { name: "Fromage blanc", kcal100: 45, protein100: 8 },
  { name: "Egg", kcal100: 143, protein100: 13 },
  { name: "Apple", kcal100: 52, protein100: 0.3 },
  { name: "Pear", kcal100: 57, protein100: 0.4 },
  { name: "Kiwi", kcal100: 61, protein100: 1.1 },
  { name: "Pineapple", kcal100: 50, protein100: 0.5 },
  { name: "Rice noodles", kcal100: 360, protein100: 7 },
  { name: "Rice cooked", kcal100: 130, protein100: 2.5 },
  { name: "Couscous cooked", kcal100: 112, protein100: 3.8 },
  { name: "Mushrooms", kcal100: 22, protein100: 3.1 },
  { name: "Onion", kcal100: 40, protein100: 1.1 },
  { name: "Olives green", kcal100: 145, protein100: 0.9 },
  { name: "Dark chocolate", kcal100: 550, protein100: 7 },
  { name: "Protein bar", kcal100: 383, protein100: 26 },
  { name: "Pistachios", kcal100: 560, protein100: 20 },
  { name: "Beef cooked", kcal100: 250, protein100: 26 },
  { name: "Pasta sauce tomato basil", kcal100: 34, protein100: 1.8 },
];

function fmtDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
}

function weightColor(curr, prev) {
  if (prev == null) return "#16a34a";
  if (curr < prev) return "#16a34a";
  if (curr > prev) return "#ef4444";
  return "#eab308";
}

function proteinColor(value) {
  return value < PROTEIN_MIN ? "#ef4444" : "#16a34a";
}

function balanceColor(value) {
  return value < 0 ? "#16a34a" : "#ef4444";
}

function newFoodItem() {
  return { meal: "breakfast", name: "", grams: "", kcal100: "", protein100: "" };
}

function computeItem(item) {
  const grams = Number(item.grams || 0);
  const kcal100 = Number(item.kcal100 || 0);
  const protein100 = Number(item.protein100 || 0);
  return {
    kcal: (grams * kcal100) / 100,
    protein: (grams * protein100) / 100,
  };
}

function findFoodMatch(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  return FOOD_LIBRARY.find((food) => food.name.toLowerCase().includes(q)) || null;
}

export default function BodyRecompTrackerApp() {
  const fileInputRef = useRef(null);
  const [days, setDays] = useState(INITIAL_DAYS);
  const [weights, setWeights] = useState(INITIAL_WEIGHTS);
  const [form, setForm] = useState({
    date: "2026-03-10",
    training: false,
    weight: "",
    items: [newFoodItem()],
  });

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.days) setDays(parsed.days);
      if (parsed.weights) setWeights(parsed.weights);
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ days, weights }));
  }, [days, weights]);

  const sortedDays = useMemo(() => [...days].sort((a, b) => a.date.localeCompare(b.date)), [days]);
  const sortedWeights = useMemo(() => [...weights].sort((a, b) => a.date.localeCompare(b.date)), [weights]);

  const itemRows = useMemo(
    () => form.items.map((item) => ({ ...item, ...computeItem(item) })),
    [form.items]
  );

  const intakeTotal = useMemo(() => itemRows.reduce((acc, i) => acc + i.kcal, 0), [itemRows]);
  const proteinTotal = useMemo(() => itemRows.reduce((acc, i) => acc + i.protein, 0), [itemRows]);
  const maintenanceToday = form.training ? REST_DAY_MAINTENANCE + TRAINING_ADDON : REST_DAY_MAINTENANCE;
  const balanceToday = intakeTotal - maintenanceToday;

  const balanceChartData = useMemo(
    () => sortedDays.map((d) => ({ ...d, label: fmtDate(d.date), fill: balanceColor(d.balance) })),
    [sortedDays]
  );

  const proteinChartData = useMemo(
    () => sortedDays.map((d) => ({ ...d, label: fmtDate(d.date), fill: proteinColor(d.protein) })),
    [sortedDays]
  );

  const fatChartData = useMemo(() => {
    let cumulative = 0;
    return sortedDays.map((d, idx) => {
      cumulative += d.balance;
      return {
        date: d.date,
        label: fmtDate(d.date),
        actual: cumulative / FAT_KCAL_PER_KG,
        normative: ((idx + 1) * NORM_DEFICIT) / FAT_KCAL_PER_KG,
      };
    });
  }, [sortedDays]);

  const weightChartData = useMemo(() => {
    let prev = null;
    return sortedWeights.map((w) => {
      const fill = weightColor(w.weight, prev);
      const out = { ...w, label: fmtDate(w.date), fill, weightLabel: w.weight.toFixed(1) };
      prev = w.weight;
      return out;
    });
  }, [sortedWeights]);

  const stats = useMemo(() => {
    const avgBalance = sortedDays.reduce((acc, d) => acc + d.balance, 0) / sortedDays.length;
    const latestWeight = sortedWeights.at(-1)?.weight ?? null;
    const cumulativeFat = fatChartData.at(-1)?.actual ?? 0;
    const latestProtein = sortedDays.at(-1)?.protein ?? 0;
    return { avgBalance, latestWeight, cumulativeFat, latestProtein };
  }, [sortedDays, sortedWeights, fatChartData]);

  function updateItem(index, field, value) {
    setForm((prev) => {
      const next = [...prev.items];
      const current = { ...next[index], [field]: value };

      if (field === "name") {
        const match = findFoodMatch(value);
        if (match) {
          current.kcal100 = String(match.kcal100);
          current.protein100 = String(match.protein100);
        }
      }

      next[index] = current;
      return { ...prev, items: next };
    });
  }

  function addFoodRow(prefill) {
    setForm((prev) => ({ ...prev, items: [...prev.items, prefill ?? newFoodItem()] }));
  }

  function removeFoodRow(index) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }

  function saveDay() {
    if (!form.date || form.items.length === 0) return;
    const balance = Number(balanceToday.toFixed(1));
    const protein = Number(proteinTotal.toFixed(1));
    const intake = Number(intakeTotal.toFixed(1));

    setDays((prev) => {
      const next = prev.filter((d) => d.date !== form.date);
      next.push({ date: form.date, balance, protein, intake, training: form.training });
      return next;
    });

    if (form.weight !== "") {
      const weight = Number(form.weight);
      setWeights((prev) => {
        const next = prev.filter((w) => w.date !== form.date);
        next.push({ date: form.date, weight });
        return next;
      });
    }

    setForm((prev) => ({
      ...prev,
      items: [newFoodItem()],
      weight: "",
    }));
  }

  function exportData() {
    const payload = JSON.stringify({ days, weights }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "body-recomp-tracker.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.days)) setDays(parsed.days);
        if (Array.isArray(parsed.weights)) setWeights(parsed.weights);
      } catch {}
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Body Recomp Tracker</h1>
              <p className="mt-2 text-slate-600">
                Meal-level logging, automatic totals, export/import, and the 4 tracking graphs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">Rest: {REST_DAY_MAINTENANCE} kcal</Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">Training: +{TRAINING_ADDON} kcal</Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">Protein: {PROTEIN_MIN}–{PROTEIN_MAX} g</Badge>
              <Button variant="outline" className="rounded-2xl" onClick={exportData}><Download className="mr-2 h-4 w-4" />Export</Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Import</Button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importData} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><Scale className="h-5 w-5 text-slate-500" /><div><div className="text-sm text-slate-500">Latest weight</div><div className="text-2xl font-semibold">{stats.latestWeight?.toFixed(1)} kg</div></div></div></CardContent></Card>
          <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><Flame className="h-5 w-5 text-slate-500" /><div><div className="text-sm text-slate-500">Average balance</div><div className="text-2xl font-semibold">{stats.avgBalance.toFixed(0)} kcal</div></div></div></CardContent></Card>
          <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><Beef className="h-5 w-5 text-slate-500" /><div><div className="text-sm text-slate-500">Latest protein</div><div className="text-2xl font-semibold">{stats.latestProtein.toFixed(0)} g</div></div></div></CardContent></Card>
          <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><Flame className="h-5 w-5 text-slate-500" /><div><div className="text-sm text-slate-500">Cumulative fat est.</div><div className="text-2xl font-semibold">{stats.cumulativeFat.toFixed(2)} kg</div></div></div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader><CardTitle className="text-xl">Meal-level day editor</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Morning weight (kg)</Label>
                  <Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="optional" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {form.training ? <Dumbbell className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {form.training ? "Training day" : "Rest day"}
                </div>
                <Button variant={form.training ? "default" : "outline"} onClick={() => setForm({ ...form, training: !form.training })}>Toggle</Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Food items</Label>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => addFoodRow()}><Plus className="mr-2 h-4 w-4" />Add item</Button>
                </div>
                <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
                  {form.items.map((item, idx) => {
                    const computed = computeItem(item);
                    return (
                      <div key={idx} className="rounded-2xl border p-3">
                        <div className="grid gap-3">
                          <div className="grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)_40px]">
                            <Input value={item.meal} onChange={(e) => updateItem(idx, "meal", e.target.value)} placeholder="meal" />
                            <Input value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} placeholder="food name" />
                            <Button variant="ghost" size="icon" onClick={() => removeFoodRow(idx)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <Input type="number" value={item.grams} onChange={(e) => updateItem(idx, "grams", e.target.value)} placeholder="grams" />
                            <Input type="number" value={item.kcal100} onChange={(e) => updateItem(idx, "kcal100", e.target.value)} placeholder="kcal / 100g" />
                            <Input type="number" value={item.protein100} onChange={(e) => updateItem(idx, "protein100", e.target.value)} placeholder="protein / 100g" />
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                            <Badge variant="secondary">{computed.kcal.toFixed(1)} kcal</Badge>
                            <Badge variant="secondary">{computed.protein.toFixed(1)} g protein</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Auto intake total</div>
                  <div className="mt-1 text-2xl font-semibold">{intakeTotal.toFixed(0)} kcal</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Auto protein total</div>
                  <div className="mt-1 text-2xl font-semibold">{proteinTotal.toFixed(0)} g</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Maintenance</div>
                  <div className="mt-1 text-2xl font-semibold">{maintenanceToday.toFixed(0)} kcal</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Balance</div>
                  <div className="mt-1 text-2xl font-semibold">{balanceToday.toFixed(0)} kcal</div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-dashed p-4">
                <div className="text-sm font-medium">Smart food search</div>
                <div className="text-sm text-slate-600">
                  Type part of a food name in the <span className="font-medium">food name</span> field and the app will auto-fill kcal and protein per 100 g when it finds a match.
                </div>
                <div className="flex flex-wrap gap-2">
                  {FOOD_LIBRARY.slice(0, 12).map((food) => (
                    <Button
                      key={food.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => addFoodRow({ meal: "snack", name: food.name, grams: 100, kcal100: food.kcal100, protein100: food.protein100 })}
                    >
                      {food.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 rounded-2xl" onClick={saveDay}><Save className="mr-2 h-4 w-4" />Save day</Button>
                <Button variant="outline" className="rounded-2xl" onClick={() => addFoodRow(DEFAULT_ITEMS[Math.floor(Math.random() * DEFAULT_ITEMS.length)])}>Quick add</Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="charts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-3xl border-0 shadow-sm">
                  <CardHeader><CardTitle>Daily Calorie Balance</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={balanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <ReferenceLine y={0} stroke="#2563eb" />
                        <ReferenceLine y={NORM_DEFICIT} stroke="#2563eb" />
                        <Bar dataKey="balance" radius={[8, 8, 0, 0]}>
                          {balanceChartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-sm">
                  <CardHeader><CardTitle>Daily Protein Intake</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={proteinChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <ReferenceLine y={PROTEIN_MIN} stroke="#2563eb" />
                        <ReferenceLine y={PROTEIN_MAX} stroke="#2563eb" strokeDasharray="6 6" />
                        <Bar dataKey="protein" radius={[8, 8, 0, 0]}>
                          {proteinChartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-sm xl:col-span-2">
                  <CardHeader><CardTitle>Cumulative Fat Change</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fatChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="normative" stroke="#f97316" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-sm xl:col-span-2">
                  <CardHeader><CardTitle>Body Weight</CardTitle></CardHeader>
                  <CardContent className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weightChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis domain={[70, "dataMax + 0.6"]} />
                        <Tooltip />
                        <Bar dataKey="weight" radius={[8, 8, 0, 0]}>
                          {weightChartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                          <LabelList dataKey="weightLabel" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="data">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader><CardTitle>Logged days</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-auto rounded-2xl border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Intake</th>
                          <th className="px-4 py-3 text-left">Balance</th>
                          <th className="px-4 py-3 text-left">Protein</th>
                          <th className="px-4 py-3 text-left">Training</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedDays.map((d) => (
                          <tr key={d.date} className="border-t">
                            <td className="px-4 py-3">{d.date}</td>
                            <td className="px-4 py-3">{(d.intake ?? d.balance + REST_DAY_MAINTENANCE).toFixed(1)}</td>
                            <td className="px-4 py-3">{d.balance.toFixed(1)}</td>
                            <td className="px-4 py-3">{d.protein.toFixed(1)}</td>
                            <td className="px-4 py-3">{d.training ? "Yes" : "No"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
