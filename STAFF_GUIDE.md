# SLCM Dashboard - Staff Guide

## 🎯 Quick Reference

**Dashboard URL**: [Your deployed URL here]
**Google Sheet**: [Link to your Google Sheet]

## 📝 Adding a New Need

### Step 1: Open the Google Sheet
1. Go to the "Needs" tab
2. Find the first empty row

### Step 2: Fill in the columns

| Column | What to Enter | Example |
|--------|---------------|---------|
| **Category** | Must be: `Money`, `Items`, or `Time` | `Money` |
| **Title** | Short, clear description | `$1000 for November Food Fund` |
| **Description** | Why it's needed (1-2 sentences) | `Help provide emergency food assistance to 50 families` |
| **Target** | Goal number (no $ or commas) | `1000` |
| **Current** | Amount raised/collected so far | `0` |
| **Link** | Where people should go | `https://slcm.org/donate` |
| **Status** | Type: `Active` | `Active` |

### Step 3: Save
- The dashboard will update automatically within 30 seconds
- Refresh the dashboard page to see it immediately

## ✅ Marking a Goal as Complete

### Option 1: Change Status
1. Find the row in the Google Sheet
2. Change **Status** from `Active` to `Completed`
3. Save the sheet
4. The goal will move to "Completed Goals" section
5. Confetti will celebrate! 🎉

### Option 2: Update Progress
1. Change **Current** to equal or exceed **Target**
2. The system will automatically mark it complete

## 🔄 Updating Progress

As donations/volunteers come in:
1. Find the row in the Google Sheet
2. Update the **Current** column with the new number
3. Save
4. Progress bar will update automatically

**Example:**
- Target: 1000
- Current: 250 → 500 → 750 → 1000 ✓

## 🎨 Choosing Links

### For Money Needs:
- Direct donation page: `https://slcm.org/donate`
- Specific campaign: `https://paypal.me/yourlink`
- Stripe link: `https://buy.stripe.com/yourlink`

### For Items Needs:
- Amazon wishlist: `https://a.co/yourwishlist`
- Google Form: `https://forms.gle/yourid`
- General donation page: `https://slcm.org/donate`

### For Time Needs:
- SignUpGenius: `https://signupgenius.com/yourlink`
- Google Calendar: `https://calendar.google.com/event`
- Volunteer page: `https://slcm.org/get-involved`

## ⚠️ Common Mistakes to Avoid

❌ **DON'T**
- Use $ signs or commas in Target/Current (use `1000` not `$1,000`)
- Mix up Category names (must be exactly `Money`, `Items`, or `Time`)
- Leave Status blank (always use `Active` or `Completed`)
- Delete the header row!

✅ **DO**
- Keep descriptions short and compelling
- Update progress regularly
- Mark completed goals right away
- Test your links before adding them

## 📊 Understanding the Dashboard

### What Shows Where

**Top Needs Section** (3 cards)
- Shows 1 priority from each category
- Picks the need with LOWEST % complete
- Only shows needs marked `Active`

**Completed Goals Section**
- Shows all completed needs
- Displays roll-up statistics
- Celebrates success!

### How Priority Works

The dashboard automatically picks:
1. One Money need (lowest % complete)
2. One Items need (lowest % complete)
3. One Time need (lowest % complete)

**Example:**
If you have:
- Food Fund: 75% complete
- Utility Help: 50% complete

The Utility Help will show (lower % = higher priority)

## 🔧 Troubleshooting

### My new need isn't showing
- Check that Category is spelled exactly: `Money`, `Items`, or `Time`
- Make sure Status is `Active`
- Wait 30 seconds and refresh the page
- Check that Target and Current are numbers only

### Progress bar looks wrong
- Remove $ signs from Target/Current
- Remove commas from Target/Current
- Make sure numbers are whole numbers (no decimals)

### Link doesn't work
- Test the link in a new browser tab
- Make sure it starts with `https://`
- Check for typos

### Dashboard shows old data
- Do a "hard refresh": Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear your browser cache
- Wait up to 1 minute for updates

## 📱 Mobile Tips

- Dashboard works great on phones!
- Staff can update the Google Sheet from mobile
- Share the dashboard link via text for quick access

## 🎯 Best Practices

### Timing
- Add new needs on Monday mornings (highest traffic)
- Mark completed goals Friday afternoons (celebrate the week)
- Update progress daily if possible

### Writing
- Keep titles under 50 characters
- Descriptions should be 1-2 sentences max
- Use active, positive language
- Include specific numbers when possible

### Categories
**Money** = Financial donations
- Food funds
- Utility assistance
- Program costs

**Items** = Physical donations
- Clothing
- Supplies
- Food items

**Time** = Volunteer opportunities
- Event help
- Ongoing programs
- One-time needs

## 💰 Budget Tracker (dashboard.slcm.org/budget)

The Budget Tracker page reads Clare's **Budget Tracking Spreadsheet** — nothing on it is typed in by hand anymore.

### What to edit
- **"Budget Tracker - Expenses" tab** → the fund cards. Column A is the fund name, then *Projected Annual Amount*, *Projected Quarterly Goals*, and *How much raised …*. The dashboard finds columns by their header text, so you can re-date the "How much raised" header (e.g. "How much raised 9/30") without breaking anything.
- **"Budget Tracker - Income Categories" tab** → the "Where Our Support Comes From" wall. Columns: *Name*, *Category*, *Month*. Category decides the column a name lands in:
  - `Individual Donor` → Donations · add ` - Monthly` to get the **monthly** badge
  - `Institutional Giving` → Churches
  - `Philanthropy` → Philanthropy
  - `Corporate Giving` → Corporate Giving
  - `Earned Income` → Earned Income
  - `Government` → Our Government Partners
- Rows whose name starts with `CAPITAL CAMPAIGN:` show up under Capital Campaign instead of the operating funds.

### What stays fixed
Fund grouping (People / Direct Assistance / Operations / Development), the "Learn More" link on Staff, the column totals on the donor wall, and the income-mix donuts are set in the code. Ask the dashboard maintainer to change those.

### How it reaches the page
The page does **not** read Clare's workbook directly (it has salary and grant tabs that must stay private). A separate one-tab sheet, **"SLCM Budget Dashboard Feed"**, mirrors just the two tabs above with `IMPORTRANGE` and is published to the web. Never publish the workbook itself.

### Something looks wrong
- **Old numbers after an edit** — the published feed refreshes every few minutes; hard-refresh the page after ~5 minutes.
- **Page shows the fallback figures** (header says "Last updated <date>" instead of "Live from the Budget Tracking Spreadsheet") — the feed sheet is unreachable or its headers changed. Open the feed sheet: if it shows `#REF!`, click the cell and choose **Allow access**.
- **A donor is missing** — check the Category spelling on the Income Categories tab; unknown categories are skipped.

---

## 📞 Get Help

### Technical Issues
- Dashboard not loading: [Your tech contact]
- Can't edit Google Sheet: Check your permissions
- Link not working: Test in incognito browser

### Questions
- What should I post?: Ask Clare or your supervisor
- How to write descriptions: See examples in the sheet
- Priority decisions: Discuss at team meeting

## 🚀 Quick Start Checklist

For new staff members:

- [ ] Get access to the Google Sheet
- [ ] Bookmark the dashboard URL
- [ ] Read this guide
- [ ] Practice adding a test need
- [ ] Practice marking a goal complete
- [ ] Know who to ask for help

---

**Remember**: Every need you post helps connect donors with real community impact. You're making it easy for people to help!

Questions? Ask Clare or check the main README.md file.
