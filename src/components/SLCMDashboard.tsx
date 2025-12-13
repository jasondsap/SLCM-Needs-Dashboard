"use client";

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

// === CONFIGURABLES ===
const SHEET_ID = ""; // Replace with your Google Sheet ID
const SHEET_RANGE = "Needs!A1:I200"; // Updated to include Deadline (H) and Priority (I) columns
const PUBLIC_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRt9CqzTveGJ-wLh6S2NYEzsEBjwKD_JvPxbGakc9DDHeZVIko6yKj9kbewSc9pMj1PBusuwpOvKidG/pub?gid=0&single=true&output=csv"; // Or use published CSV URL
const USE_SAMPLE_DATA = false; // Set to false when ready to use real Google Sheets

// === SAMPLE DATA ===
// Realistic data based on SLCM's actual programs from the uploaded spreadsheets
const SAMPLE_ROWS = [
    ["Category", "Title", "Description", "Target", "Current", "Link", "Status", "Deadline", "Priority"],
    [
        "Money",
        "$500 Emergency Utility Assistance",
        "Critical: Prevent power shutoffs for 3 families this week",
        "500",
        "150",
        "https://slcm.org/donate",
        "Active",
        "11/12/2024",
        "High"
    ],
    [
        "Money",
        "$1,000 for November Food Fund",
        "Help provide emergency food assistance to 50 families in South Louisville this month",
        "1000",
        "750",
        "https://slcm.org/donate",
        "Active",
        "11/30/2024",
        ""
    ],
    [
        "Items",
        "120 Bags of Size 6/7 Diapers",
        "Essential supplies for families with young children in our community",
        "120",
        "90",
        "https://slcm.org/donate",
        "Active",
        "12/15/2024",
        ""
    ],
    [
        "Items",
        "30 Winter Coats (Adult Sizes)",
        "Urgent need before cold snap hits Louisville next week",
        "30",
        "8",
        "https://slcm.org/donate",
        "Active",
        "11/15/2024",
        ""
    ],
    [
        "Time",
        "Rosewater Saturday Volunteers",
        "Help serve meals and organize supplies every Saturday morning (9am-12pm)",
        "12",
        "8",
        "https://slcm.org/get-involved",
        "Active",
        "",
        ""
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
    deadline?: string; // Format: MM/DD/YYYY or blank
    priority?: "High" | "Medium" | "Low" | string; // Manual priority override
    urgencyLevel?: "urgent" | "important" | "standard"; // Calculated urgency
    daysRemaining?: number; // Calculated days until deadline
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
        console.error("Expected columns: Category, Title, Description, Target, Current, Link, Status, Deadline, Priority");
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
    const cDeadline = idx("Deadline");
    const cPriority = idx("Priority");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day for comparison

    return data
        .filter((r) => cTitle >= 0 && cCat >= 0 && r[cTitle] && r[cCat])
        .map((r) => {
            const deadlineStr = cDeadline >= 0 ? (r[cDeadline] || "").trim() : "";
            const priorityStr = cPriority >= 0 ? (r[cPriority] || "").trim() : "";

            // Parse deadline
            let deadlineDate: Date | null = null;
            let daysRemaining: number | undefined = undefined;

            if (deadlineStr) {
                // Try parsing MM/DD/YYYY or other common formats
                const parsed = new Date(deadlineStr);
                if (!isNaN(parsed.getTime())) {
                    deadlineDate = parsed;
                    deadlineDate.setHours(0, 0, 0, 0);
                    const diffTime = deadlineDate.getTime() - today.getTime();
                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
            }

            // Calculate urgency level
            let urgencyLevel: "urgent" | "important" | "standard" = "standard";

            if (priorityStr.toLowerCase() === "high") {
                urgencyLevel = "urgent";
            } else if (daysRemaining !== undefined) {
                if (daysRemaining <= 7) {
                    urgencyLevel = "urgent";
                } else if (daysRemaining <= 30) {
                    urgencyLevel = "important";
                }
            }

            return {
                category: (r[cCat] || "").trim(),
                title: (r[cTitle] || "").trim(),
                description: (r[cDesc] || "").trim(),
                target: Number(String(r[cTarget] || 0).replace(/[^0-9.]/g, "")) || 0,
                current: Number(String(r[cCurrent] || 0).replace(/[^0-9.]/g, "")) || 0,
                link: r[cLink] || "",
                status: r[cStatus] || "Active",
                deadline: deadlineStr,
                priority: priorityStr,
                urgencyLevel,
                daysRemaining,
            };
        });
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

const GoalCard = ({ goal, index, totalInCategory, onViewAll }: {
    goal: Goal;
    index: number;
    totalInCategory?: number;
    onViewAll?: () => void;
}) => {
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

    // Urgency badge configuration
    const getUrgencyBadge = () => {
        if (goal.urgencyLevel === "urgent") {
            return {
                show: true,
                icon: "🔴",
                text: "URGENT",
                bgColor: "bg-red-100",
                textColor: "text-red-700",
                borderColor: "border-red-200",
            };
        } else if (goal.urgencyLevel === "important") {
            return {
                show: true,
                icon: "⚠️",
                text: "Important",
                bgColor: "bg-orange-100",
                textColor: "text-orange-700",
                borderColor: "border-orange-200",
            };
        }
        return { show: false };
    };

    const urgencyBadge = getUrgencyBadge();

    // Format days remaining
    const getDaysRemainingText = () => {
        if (goal.daysRemaining === undefined) return null;

        if (goal.daysRemaining < 0) {
            return <span className="text-red-600 font-semibold">Deadline passed</span>;
        } else if (goal.daysRemaining === 0) {
            return <span className="text-red-600 font-semibold">Due today!</span>;
        } else if (goal.daysRemaining === 1) {
            return <span className="text-red-600 font-semibold">1 day left</span>;
        } else if (goal.daysRemaining <= 7) {
            return <span className="text-red-600 font-semibold">{goal.daysRemaining} days left</span>;
        } else if (goal.daysRemaining <= 30) {
            return <span className="text-orange-600 font-medium">{goal.daysRemaining} days left</span>;
        } else {
            return <span className="text-gray-600">{goal.daysRemaining} days left</span>;
        }
    };

    const daysRemainingText = getDaysRemainingText();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.4 }}
        >
            <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all border-0 overflow-hidden">
                {/* Top color bar */}
                <div className={`h-2 ${cat.includes("money") ? "bg-emerald-500" : cat.includes("time") ? "bg-blue-500" : "bg-purple-500"}`} />

                <CardContent className="p-6">
                    {/* Urgency Badge */}
                    {urgencyBadge.show && (
                        <div className={`mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${urgencyBadge.bgColor} ${urgencyBadge.textColor} ${urgencyBadge.borderColor}`}>
                            <span className="text-sm">{urgencyBadge.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-wide">{urgencyBadge.text}</span>
                            {daysRemainingText && (
                                <>
                                    <span className="text-xs">•</span>
                                    <span className="text-xs font-semibold">{daysRemainingText}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Category Icon & Name */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${cat.includes("money") ? "bg-emerald-100 text-emerald-700" : cat.includes("time") ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                            <CategoryIcon category={goal.category} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                {goal.category}
                            </h2>
                            {!urgencyBadge.show && daysRemainingText && (
                                <p className="text-xs mt-0.5">{daysRemainingText}</p>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 min-h-[3rem]">
                        {goal.title}
                    </h3>

                    {/* Description */}
                    {goal.description && (
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed min-h-[3rem]">
                            {goal.description}
                        </p>
                    )}

                    {/* Progress Bar */}
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

                    {/* View All Button (if multiple needs in category) */}
                    {totalInCategory && totalInCategory > 1 && onViewAll && (
                        <button
                            onClick={onViewAll}
                            className="w-full mb-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <span>View All {goal.category} Needs</span>
                            <span className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                {totalInCategory}
                            </span>
                        </button>
                    )}

                    {/* Action Button */}
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
    const [viewAllCategory, setViewAllCategory] = useState<string | null>(null);

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

                // Sort by smart priority:
                // 1. Urgency level (urgent > important > standard)
                // 2. Within same urgency, lowest % complete
                return inCat.sort((a, b) => {
                    // Priority weights
                    const urgencyWeight = {
                        urgent: 1000,
                        important: 500,
                        standard: 0,
                    };

                    const aScore = urgencyWeight[a.urgencyLevel || "standard"] - pct(a.current, a.target);
                    const bScore = urgencyWeight[b.urgencyLevel || "standard"] - pct(b.current, b.target);

                    return bScore - aScore; // Higher score = higher priority
                })[0];
            })
            .filter(Boolean) as Goal[];
    }, [active]);

    // Get all goals for a specific category (for View All modal)
    const getGoalsByCategory = (category: string) => {
        return active
            .filter((g) => g.category.toLowerCase().startsWith(category.toLowerCase()))
            .sort((a, b) => {
                const urgencyWeight = { urgent: 1000, important: 500, standard: 0 };
                const aScore = urgencyWeight[a.urgencyLevel || "standard"] - pct(a.current, a.target);
                const bScore = urgencyWeight[b.urgencyLevel || "standard"] - pct(b.current, b.target);
                return bScore - aScore;
            });
    };

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
                            {topByCategory.map((goal, i) => {
                                const categoryGoals = getGoalsByCategory(goal.category);
                                return (
                                    <GoalCard
                                        key={goal.title + i}
                                        goal={goal}
                                        index={i}
                                        totalInCategory={categoryGoals.length}
                                        onViewAll={() => setViewAllCategory(goal.category)}
                                    />
                                );
                            })}
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
                                <a href="https://slcm.org/give" target="_blank" rel="noreferrer">
                                    Make a Donation
                                </a>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="bg-emerald-700/50 border-2 border-white text-white hover:bg-emerald-600 font-semibold px-8 py-6 text-lg rounded-xl"
                                asChild
                            >
                                <a href="https://slcm.org/volunteer" target="_blank" rel="noreferrer">
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

            {/* View All Modal */}
            <AnimatePresence>
                {viewAllCategory && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setViewAllCategory(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <CategoryIcon category={viewAllCategory} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            All {viewAllCategory} Needs
                                        </h2>
                                        <p className="text-emerald-100 text-sm">
                                            {getGoalsByCategory(viewAllCategory).length} active {getGoalsByCategory(viewAllCategory).length === 1 ? 'need' : 'needs'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewAllCategory(null)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    aria-label="Close"
                                >
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {getGoalsByCategory(viewAllCategory).map((goal, idx) => (
                                        <motion.div
                                            key={goal.title + idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card className="rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200">
                                                <CardContent className="p-5">
                                                    {/* Urgency Badge */}
                                                    {goal.urgencyLevel && goal.urgencyLevel !== "standard" && (
                                                        <div className={`mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${goal.urgencyLevel === "urgent"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-orange-100 text-orange-700"
                                                            }`}>
                                                            <span>{goal.urgencyLevel === "urgent" ? "🔴" : "⚠️"}</span>
                                                            <span className="uppercase">
                                                                {goal.urgencyLevel === "urgent" ? "URGENT" : "Important"}
                                                            </span>
                                                            {goal.daysRemaining !== undefined && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{goal.daysRemaining} days left</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Title */}
                                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                        {goal.title}
                                                    </h3>

                                                    {/* Description */}
                                                    {goal.description && (
                                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                            {goal.description}
                                                        </p>
                                                    )}

                                                    {/* Progress */}
                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                            <span className="font-semibold">{goal.current.toLocaleString()}</span>
                                                            <span>of {goal.target.toLocaleString()}</span>
                                                        </div>
                                                        <Progress value={pct(goal.current, goal.target)} className="h-2" />
                                                        <p className="text-xs text-gray-500 mt-1 text-right">
                                                            {pct(goal.current, goal.target)}% complete
                                                        </p>
                                                    </div>

                                                    {/* Action Button */}
                                                    <Button
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-3 font-semibold text-sm"
                                                        asChild
                                                    >
                                                        <a href={goal.link || "#"} target="_blank" rel="noreferrer">
                                                            {goal.category.toLowerCase().includes("money")
                                                                ? "Donate Now"
                                                                : goal.category.toLowerCase().includes("time")
                                                                    ? "Sign Up"
                                                                    : "Pledge Items"}
                                                        </a>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
