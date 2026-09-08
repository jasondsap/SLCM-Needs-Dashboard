# SLCM Donor Dashboard - Complete Setup Guide

## 🎯 Quick Start Demo

This dashboard is **ready to run immediately** with sample data. Follow these steps:

### Option 1: Run Locally (Fastest)

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open http://localhost:3000
```

The dashboard will display with realistic sample data and all features working!

## 🚀 Deploy to Vercel (Recommended - 5 minutes)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial SLCM dashboard"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Deploy"
5. Done! Your dashboard is live at `your-project.vercel.app`

## 📊 Connecting Your Google Sheet

### Phase 1: Prepare Your Google Sheet

1. **Create a new Google Sheet** or use existing
2. **Create a tab called "Needs"** with these exact column headers (order doesn't matter):
   ```
   Category | Title | Description | Target | Current | Link | Status
   ```

3. **Add your data**. Here's an example row:
   ```
   Money | $1000 for Food Fund | Help feed families | 1000 | 750 | https://slcm.org/donate | Active
   ```

4. **Categories must be**: `Money`, `Items`, or `Time` (case-insensitive)
5. **Status values**: `Active` (shows on dashboard) or `Completed` (moves to completed section)

### Phase 2: Choose Your Connection Method

#### Method A: Published CSV (Easiest, No Credentials)

1. In your Google Sheet, go to **File → Share → Publish to web**
2. Choose the **"Needs" tab** and select **CSV** format
3. Click **Publish** and copy the URL
4. In `src/components/SLCMDashboard.tsx`, update:
   ```typescript
   const PUBLIC_CSV_URL = "YOUR_PUBLISHED_CSV_URL_HERE";
   const USE_SAMPLE_DATA = false;
   ```

**Pros:** Super simple, no API keys
**Cons:** Sheet must be publicly viewable (but URL is obscure)

#### Method B: Google Sheets API (More Secure)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Sheets API**
4. Create credentials → **API Key**
5. Copy your API key
6. In your Google Sheet, click **Share** → Set to "Anyone with the link can view"
7. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

8. Add to your `.env.local` file:
   ```
   NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
   ```

9. In `src/components/SLCMDashboard.tsx`, update:
   ```typescript
   const SHEET_ID = "YOUR_SHEET_ID_HERE";
   const USE_SAMPLE_DATA = false;
   ```

10. For Vercel deployment, add the environment variable:
    - Go to your Vercel project → Settings → Environment Variables
    - Add `NEXT_PUBLIC_GOOGLE_API_KEY` with your API key

## 💰 Connecting the Budget Tracker (/budget)

`/budget` is unlisted and rendered by `src/components/SLCMBudgetDashboard.tsx`. It reads a published CSV the same way the Needs dashboard does, but through a **companion sheet** so that Clare's full workbook (salaries, tax, grant pipeline) is never published.

1. **Create the feed sheet.** In Google Sheets, *File → Import* the file `docs/SLCM Budget Dashboard Feed.csv` (or make a blank sheet and paste the two formulas below). Name it **SLCM Budget Dashboard Feed**.
   - `A2`: `=IMPORTRANGE("<Budget Tracking Spreadsheet URL>","'Budget Tracker - Expenses'!A1:I40")`
   - `K2`: `=IMPORTRANGE("<Budget Tracking Spreadsheet URL>","'Budget Tracker - Income Categories'!A1:C200")`
   - Click each `#REF!` cell once and choose **Allow access**.
2. **Publish it.** *File → Share → Publish to web* → this sheet → **Comma-separated values (.csv)** → Publish. Copy the link.
3. **Paste the link** into `BUDGET_FEED_CSV_URL` at the top of `SLCMBudgetDashboard.tsx` and deploy.

If the feed is empty, unreachable, or missing its headers the page silently falls back to the static `CATEGORIES` / `CAPITAL` / `INCOME_COLUMNS` constants, so it never renders blank. Fund groups, links, donor-column totals, and the income-mix donuts are not in the sheet and stay in code. Column matching is by header text (prefix, case-insensitive), so column order and the date in "How much raised 7/13" can change freely.

## 📝 How Staff Update Needs

### Current Workflow (Direct Sheet Editing)
1. Staff member opens the Google Sheet
2. Adds a new row with the need details
3. Sets Status to "Active"
4. Dashboard updates on next page refresh (about 30 seconds)

### When a Goal is Completed
1. Staff changes Status from "Active" to "Completed", OR
2. Staff updates Current to equal/exceed Target
3. Goal automatically moves to "Completed Goals" section
4. Confetti celebration triggers! 🎉

## 🎨 Customization

### Change Colors
Edit in `src/components/SLCMDashboard.tsx`:
```typescript
// Money category color
bg-emerald-600 → bg-YOUR-COLOR-600

// Items category color  
bg-purple-600 → bg-YOUR-COLOR-600

// Time category color
bg-blue-600 → bg-YOUR-COLOR-600
```

### Change Links
Update default links in the component:
```typescript
<Button asChild>
  <a href="YOUR_CUSTOM_DONATION_LINK">Donate Now</a>
</Button>
```

### Adjust Refresh Rate
To make the dashboard check for updates more frequently:
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const r = await fetchSheetRows();
    setRows(r);
  }, 60000); // 60000ms = 1 minute
  
  return () => clearInterval(interval);
}, []);
```

## 🏗️ Project Structure

```
slcm-dashboard/
├── src/
│   ├── components/
│   │   └── SLCMDashboard.tsx      # Main dashboard component
│   ├── app/
│   │   ├── page.tsx                # Home page (renders dashboard)
│   │   ├── layout.tsx              # App layout
│   │   └── globals.css             # Global styles
├── public/
│   └── (static assets)
├── package.json
├── tsconfig.json
└── README.md
```

## 📋 Google Sheet Template

Copy this structure for your "Needs" tab:

| Category | Title | Description | Target | Current | Link | Status |
|----------|-------|-------------|--------|---------|------|--------|
| Money | $1000 for November Food | Help feed families in South Louisville | 1000 | 750 | https://slcm.org/donate | Active |
| Items | 120 Bags Size 6/7 Diapers | Essential supplies for families | 120 | 90 | https://slcm.org/donate | Active |
| Time | Saturday Volunteers | Help serve meals (9am-12pm) | 12 | 8 | https://slcm.org/get-involved | Active |

## 🔧 Troubleshooting

### Dashboard shows sample data
- Check that `USE_SAMPLE_DATA = false` in `SLCMDashboard.tsx`
- Verify your Google Sheet ID or CSV URL is correct
- Check browser console for errors

### "Missing required columns" error
- Ensure your Google Sheet has all required headers (exact spelling)
- Headers: Category, Title, Description, Target, Current, Link, Status

### Progress bars not showing correctly
- Ensure Target and Current are numbers (no $ or commas in the sheet)
- Example: Use `1000` not `$1,000`

### Sheet not updating
- The dashboard caches data for 30 seconds by default
- Do a hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## 🎯 Features

✅ **Live Data**: Pulls from Google Sheets in real-time
✅ **Three Categories**: Money, Items, and Time
✅ **Progress Tracking**: Visual thermometers for each goal
✅ **Completed Goals**: Celebrates achievements with confetti
✅ **Roll-up Stats**: Shows total impact across all goals
✅ **Mobile Responsive**: Works perfectly on phones and tablets
✅ **Smooth Animations**: Professional transitions and effects
✅ **SLCM Branding**: Matches organization's colors and messaging
✅ **Error Handling**: Graceful fallbacks if data fetch fails
✅ **Header Validation**: Alerts if sheet structure is wrong

## 🚀 Next Steps (Future Enhancements)

### Phase 2 Ideas:
1. **Admin Panel**: Password-protected interface for staff to add needs
2. **Payment Integration**: Direct Stripe/PayPal checkout on dashboard
3. **Volunteer Sign-up**: Built-in form instead of external links
4. **Email Notifications**: Alert donors when goals are close to completion
5. **Impact Stories**: Add photos and testimonials to completed goals
6. **Analytics**: Track which goals get the most engagement
7. **Multi-language**: Spanish translation toggle

## 📞 Support

Questions? Contact:
- Technical issues: [Your contact]
- SLCM operations: https://slcm.org

---

Built with ❤️ for South Louisville Community Ministries
