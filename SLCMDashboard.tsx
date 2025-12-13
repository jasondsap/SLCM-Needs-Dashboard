import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { DollarSign, Package, Clock, CheckCircle2, Heart } from "lucide-react";

/**
 * SLCM Donor Dashboard - Production Ready Demo
 * 
 * FEATURES:
 * - Works immediately with realistic sample data
 * - Google Sheets integration ready (just add credentials)
 * - Confetti celebrations when goals complete
 * - Header validation with helpful errors
 * - SLCM brand colors and messaging
 * - Responsive design for all devices
 * - Smooth animations and transitions
 * 
 * SETUP INSTRUCTIONS:
 * See README.md for deploying to Vercel/Netlify and connecting your Google Sheet
 */

// === CONFIGURATION ===
const SHEET_ID = "YOUR_SHEET_ID_HERE"; // Replace with your Google Sheet ID
const SHEET_RANGE = "Needs!A1:G200";
const PUBLIC_CSV_URL = ""; // Or use published CSV URL
const USE_SAMPLE_DATA = true; // Set to false when ready to use real Google Sheets

// === SAMPLE DATA ===
// Realistic data based on SLCM's actual programs from the uploaded spreadsheets
const SAMPLE_ROWS = [
  ["Category", "Title", "Description", "Target", "Current", "Link", "Status"],
  [
    "Money",
    "$1,000 for November Food Fund",
    "Help provide emergency food assistance to 50 families in South Louisville this month",
    "1000",
    "750",
    "https://slcm.org/donate",
    "Active"
  ],
  [
    "Items",
    "120 Bags of Size 6/7 Diapers",
    "Essential supplies for families with young children in our community",
    "120",
    "90",
    "https://slcm.org/donate",
    "Active"
  ],
  [
    "Time",
    "Rosewater Saturday Volunteers",
    "Help serve meals and organize supplies every Saturday morning (9am-12pm)",
    "12",
    "8",
    "https://slcm.org/get-involved",
    "Active"
  ],
  [
    "Money",
    "$2,500 for Utility Assistance",
    "Prevent power shutoffs for 10 families during winter months",
    "2500",
    "1200",
    "https://slcm.org/donate",
    "Active"
  ],
  [
    "Items",
    "50 Winter Coats (Adult Sizes)",
    "Keep neighbors warm through Louisville's cold season",
    "50",
    "28",
    "https://slcm.org/donate",
    "Active"
  ],
  [
    "Time",
    "Housing Navigation Support",
    "Volunteer to help neighbors find and secure stable housing (4 hours/week)",
    "6",
    "4",
    "https://slcm.org/get-involved",
    "Active"
  ],
  [
    "Money",
    "$500 Holiday Food Boxes",
    "Provided Thanksgiving meals to 25 families in need",
    "500",
    "500",
    "https://slcm.org/donate",
    "Completed"
  ],
  [
    "Items",
    "100 School Supply Kits",
    "Helped students start the school year prepared and confident",
    "100",
    "100",
    "https://slcm.org/donate",
    "Completed"
  ],
  [
    "Time",
    "Summer Food Program Volunteers",
    "Served 200+ children during summer break",
    "20",
    "20",
    "https://slcm.org/get-involved",
    "Completed"
  ],
];

// === TYPES ===
export type Goal = {
  category: "Money" | "Items" | "Time" | string;
  title: string;
  description: string;
  target: number;
  current: number;
  link?: string;
  status?: string;
};

// === UTILITIES ===
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function validateHeaders(headers: string[]): { valid: boolean; missing: string[] } {
  const required = ["Category", "Title", "Description", "Target", "Current", "Link", "Status"];
  const headerLower = headers.map(h => (h || "").toLowerCase());
  const missing = required.filter(r => !headerLower.includes(r.toLowerCase()));
  return { valid: missing.length === 0, missing };
}

async function fetchSheetRows(): Promise<string[][]> {
  if (USE_SAMPLE_DATA) {
    console.log("Using sample data (USE_SAMPLE_DATA = true)");
    return SAMPLE_ROWS;
  }

  try {
    if (PUBLIC_CSV_URL) {
      const res = await fetch(PUBLIC_CSV_URL);
      if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
      const text = await res.text();
      return parseCSV(text);
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("No Google API key found, falling back to sample data");
      return SAMPLE_ROWS;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
      SHEET_RANGE
    )}?key=${apiKey}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);
    const data = await res.json();
    return data.values || [];
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    console.log("Falling back to sample data");
    return SAMPLE_ROWS;
  }
}

function rowsToGoals(rows: string[][]): Goal[] {
  if (!rows.length) return [];
  
  const [header, ...data] = rows;
  
  // Validate headers
  const validation = validateHeaders(header);
  if (!validation.valid) {
    console.error("Missing required columns:", validation.missing);
    console.error("Expected columns: Category, Title, Description, Target, Current, Link, Status");
  }
  
  const idx = (name: string) => 
    header.findIndex((h) => (h || "").toLowerCase() === name.toLowerCase());
  
  const cCat = idx("Category");
  const cTitle = idx("Title");
  const cDesc = idx("Description");
  const cTarget = idx("Target");
  const cCurrent = idx("Current");
  const cLink = idx("Link");
  const cStatus = idx("Status");

  return data
    .filter((r) => cTitle >= 0 && cCat >= 0 && r[cTitle] && r[cCat])
    .map((r) => ({
      category: (r[cCat] || "").trim(),
      title: (r[cTitle] || "").trim(),
      description: (r[cDesc] || "").trim(),
      target: Number(String(r[cTarget] || 0).replace(/[^0-9.]/g, "")) || 0,
      current: Number(String(r[cCurrent] || 0).replace(/[^0-9.]/g, "")) || 0,
      link: r[cLink] || "",
      status: r[cStatus] || "Active",
    }));
}

function pct(current: number, target: number): number {
  if (!target) return 0;
  const val = Math.round((current / target) * 100);
  return Math.max(0, Math.min(100, val));
}

function triggerConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// === COMPONENTS ===
const CategoryIcon = ({ category }: { category: string }) => {
  const cat = category.toLowerCase();
  if (cat.includes("money")) return <DollarSign className="w-6 h-6" />;
  if (cat.includes("item")) return <Package className="w-6 h-6" />;
  if (cat.includes("time")) return <Clock className="w-6 h-6" />;
  return <Heart className="w-6 h-6" />;
};

const GoalCard = ({ goal, index }: { goal: Goal; index: number }) => {
  const percentage = pct(goal.current, goal.target);
  const cat = goal.category.toLowerCase();
  
  const buttonText = cat.includes("money")
    ? "Donate Now"
    : cat.includes("time")
    ? "Sign Up to Volunteer"
    : "Pledge Items";

  const colorClass = cat.includes("money")
    ? "bg-emerald-600 hover:bg-emerald-700"
    : cat.includes("time")
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-purple-600 hover:bg-purple-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
    >
      <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all border-0 overflow-hidden">
        <div className={`h-2 ${cat.includes("money") ? "bg-emerald-500" : cat.includes("time") ? "bg-blue-500" : "bg-purple-500"}`} />
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${cat.includes("money") ? "bg-emerald-100 text-emerald-700" : cat.includes("time") ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
              <CategoryIcon category={goal.category} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {goal.category}
              </h2>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3 min-h-[3rem]">
            {goal.title}
          </h3>

          {goal.description && (
            <p className="text-gray-600 text-sm mb-4 leading-relaxed min-h-[3rem]">
              {goal.description}
            </p>
          )}

          <div className="w-full mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600">Progress</span>
              <span className="text-xs font-bold text-gray-900">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3 rounded-full" />
            <p className="text-sm text-gray-500 mt-2 flex justify-between">
              <span className="font-semibold">{goal.current.toLocaleString()}</span>
              <span>of {goal.target.toLocaleString()}</span>
            </p>
          </div>

          <Button 
            className={`w-full ${colorClass} text-white rounded-xl py-6 font-semibold text-base shadow-md hover:shadow-lg transition-all`}
            asChild
          >
            <a href={goal.link || "#"} target="_blank" rel="noreferrer">
              {buttonText}
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// === MAIN COMPONENT ===
export default function SLCMDashboard() {
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetchSheetRows();
      setRows(r);
      setLoading(false);
    })();
  }, []);

  const goals = useMemo(() => rowsToGoals(rows), [rows]);

  const active = useMemo(
    () => goals.filter((g) => (g.status || "Active").toLowerCase() === "active"),
    [goals]
  );

  const completed = useMemo(
    () => goals.filter((g) => 
      (g.current >= g.target && g.target > 0) || 
      (g.status || "").toLowerCase() === "completed"
    ),
    [goals]
  );

  // Trigger confetti when completed goals exist
  useEffect(() => {
    if (completed.length > 0 && !hasShownConfetti && !loading) {
      setTimeout(triggerConfetti, 500);
      setHasShownConfetti(true);
    }
  }, [completed.length, hasShownConfetti, loading]);

  const topByCategory = useMemo(() => {
    const cats = ["Money", "Items", "Time"] as const;
    return cats
      .map((cat) => {
        const inCat = active.filter((g) => 
          g.category.toLowerCase().startsWith(cat.toLowerCase())
        );
        if (!inCat.length) return null;
        return inCat.sort((a, b) => 
          pct(a.current, a.target) - pct(b.current, b.target)
        )[0];
      })
      .filter(Boolean) as Goal[];
  }, [active]);

  const stats = useMemo(() => {
    const totalCompleted = completed.length;
    const moneyCompleted = completed
      .filter((g) => g.category.toLowerCase().includes("money"))
      .reduce((sum, g) => sum + (g.target || 0), 0);
    const itemsCompleted = completed
      .filter((g) => g.category.toLowerCase().includes("item"))
      .reduce((sum, g) => sum + (g.target || 0), 0);
    const timeCompleted = completed
      .filter((g) => g.category.toLowerCase().includes("time"))
      .reduce((sum, g) => sum + (g.target || 0), 0);
    return { totalCompleted, moneyCompleted, itemsCompleted, timeCompleted };
  }, [completed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading community needs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                South Louisville Community Impact
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                See how you can make a difference today. Every contribution brings our neighbors 
                closer to stability, dignity, and lasting community.
              </p>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Top Needs */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Top Needs Right Now</h2>
            <p className="text-gray-600">
              These are our community's most urgent priorities. Your support makes an immediate impact.
            </p>
          </motion.div>

          {topByCategory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topByCategory.map((goal, i) => (
                <GoalCard key={goal.title + i} goal={goal} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <p className="text-gray-500">No active needs at the moment. Check back soon!</p>
            </div>
          )}
        </section>

        {/* Completed Goals */}
        {completed.length > 0 && (
          <section className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Completed Goals</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Together, We've Made Real Progress
                </h2>
                <div className="text-gray-600 space-y-1">
                  <p className="text-lg font-semibold">
                    {stats.totalCompleted} goal{stats.totalCompleted === 1 ? "" : "s"} achieved!
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    {stats.moneyCompleted > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                        ${stats.moneyCompleted.toLocaleString()} raised
                      </span>
                    )}
                    {stats.itemsCompleted > 0 && (
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                        {stats.itemsCompleted.toLocaleString()} items collected
                      </span>
                    )}
                    {stats.timeCompleted > 0 && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {stats.timeCompleted.toLocaleString()} volunteer shifts filled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {completed.map((goal, i) => (
                  <motion.div
                    key={`${goal.title}-${i}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <Card className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs uppercase tracking-wide text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded">
                            {goal.category}
                          </span>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            {goal.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Goal: {goal.target.toLocaleString()}</span>
                          <span className="font-semibold text-emerald-700">✓ Achieved</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        )}

        {/* Call to Action */}
        <section className="text-center py-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl shadow-xl text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-4">Every Contribution Matters</h2>
            <p className="text-emerald-100 max-w-2xl mx-auto mb-6 text-lg">
              SLCM provides emergency assistance and compassionate advocacy to low-income 
              neighbors in crisis. Together, we're building lasting community in South Louisville.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-emerald-700 hover:bg-gray-100 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg"
                asChild
              >
                <a href="https://slcm.org/donate" target="_blank" rel="noreferrer">
                  Make a Donation
                </a>
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="bg-emerald-700/50 border-2 border-white text-white hover:bg-emerald-600 font-semibold px-8 py-6 text-lg rounded-xl"
                asChild
              >
                <a href="https://slcm.org/get-involved" target="_blank" rel="noreferrer">
                  Volunteer With Us
                </a>
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 text-sm">
          <p className="mb-2">
            <strong className="text-gray-900">South Louisville Community Ministries</strong>
          </p>
          <p>
            Emergency assistance, compassionate advocacy, and lasting community for our neighbors in need.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            This dashboard updates as staff add new needs. Questions? Contact SLCM directly.
          </p>
        </div>
      </footer>
    </div>
  );
}
