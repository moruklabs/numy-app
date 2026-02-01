import { Document } from "../entities/Document";
import { createLine } from "../entities/Line";

// Default example documents from design screenshots
function createExampleDocument(title: string, expressions: string[], id?: string): Document {
  const now = new Date();
  const lines = expressions.map((expr, idx) => createLine(expr, idx));
  return {
    id: id || `example_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    lines,
    variables: new Map(),
    createdAt: now,
    updatedAt: now,
  };
}

export function getDefaultExamples(): Document[] {
  return [
    // ASO Showcase Examples with comments explaining features
    createExampleDocument(
      "What is Numy",
      [
        "// Type naturally, get answers",
        "5 times 3",
        "20% of 150",
        "// Convert anything",
        "100 usd in eur",
        "5 km in miles",
      ],
      "example_welcome"
    ),
    createExampleDocument(
      "Shopping Made Easy",
      [
        "// Calculate discounts instantly",
        "20% off $89.99",
        "// Split bills with friends",
        "$156.80 / 4",
        "// Add tax to your total",
        "$45 + 8% of $45",
      ],
      "example_shopping"
    ),
    createExampleDocument(
      "Tip Calculator",
      [
        "// Dinner bill",
        "$67.50",
        "// 18% tip",
        "18% of $67.50",
        "// Total with tip",
        "$67.50 + 18% of $67.50",
      ],
      "example_tipping"
    ),
    createExampleDocument(
      "Recipe Converter",
      [
        "// Convert recipe measurements",
        "2 cups in ml",
        "500 g in lb",
        "// Scale ingredients",
        "1.5 * 250 ml",
        "350 f in c",
      ],
      "example_cooking"
    ),
    createExampleDocument(
      "Travel Helper",
      [
        "// Convert currencies",
        "500 usd in eur",
        "1000 jpy in usd",
        "// Distance conversions",
        "100 km in miles",
        "5280 ft in km",
      ],
      "example_travel"
    ),
    createExampleDocument(
      "Date Countdown",
      [
        "// Days until events",
        "days until december 25",
        "days until january 1",
        "// Plan ahead",
        "today + 30",
        "today + 90",
      ],
      "example_dates"
    ),
    createExampleDocument(
      "Budget Planner",
      [
        "// Set your values",
        "income = 5000",
        "rent = 1500",
        "// Calculate savings",
        "income - rent",
        "30% of income",
      ],
      "example_budget"
    ),
    createExampleDocument(
      "Quick Math",
      [
        "// Natural language works",
        "12 squared",
        "square root of 144",
        "// Scientific functions",
        "sin(30°)",
        "log(100)",
      ],
      "example_math"
    ),
    createExampleDocument(
      "Unit Conversions",
      ["// Length", "6 ft in cm", "// Weight", "150 lb in kg", "// Data", "2 GB in MB"],
      "example_units"
    ),
    createExampleDocument(
      "For Developers",
      [
        "// CSS unit conversions",
        "16 px in em",
        "2 em in px",
        "// Responsive calculations",
        "1920 / 16",
        "100 / 3",
      ],
      "example_css"
    ),
  ];
}
