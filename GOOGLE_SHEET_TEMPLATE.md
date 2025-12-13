# SLCM Dashboard - Google Sheet Template

## Setting Up Your Google Sheet

### Step 1: Create New Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Name it: "SLCM Community Needs Dashboard"

### Step 2: Create "Needs" Tab
1. Rename "Sheet1" to "Needs" (right-click → Rename)
2. Add these exact headers in Row 1:

```
A1: Category
B1: Title  
C1: Description
D1: Target
E1: Current
F1: Link
G1: Status
```

### Step 3: Add Sample Data
Copy these examples to see how it works:

**Row 2** (Money Example):
```
A2: Money
B2: $1000 for November Food Fund
C2: Help provide emergency food assistance to 50 families in South Louisville this month
D2: 1000
E2: 750
F2: https://slcm.org/donate
G2: Active
```

**Row 3** (Items Example):
```
A3: Items
B3: 120 Bags of Size 6/7 Diapers
C3: Essential supplies for families with young children in our community
D3: 120
E3: 90
F3: https://slcm.org/donate
G3: Active
```

**Row 4** (Time Example):
```
A4: Time
B4: Rosewater Saturday Volunteers
C4: Help serve meals and organize supplies every Saturday morning (9am-12pm)
D4: 12
E4: 8
F4: https://slcm.org/get-involved
G4: Active
```

**Row 5** (Completed Example):
```
A5: Money
B5: $500 Holiday Food Boxes
C5: Provided Thanksgiving meals to 25 families in need
D5: 500
E5: 500
F5: https://slcm.org/donate
G5: Completed
```

### Step 4: Format for Readability (Optional but Nice)

1. **Freeze header row**:
   - Click cell A2
   - View → Freeze → 1 row

2. **Make headers bold**:
   - Select row 1
   - Click Bold button

3. **Add color to headers**:
   - Select row 1
   - Fill color → Light green

4. **Set column widths**:
   - Category: 80px
   - Title: 250px
   - Description: 400px
   - Target: 80px
   - Current: 80px
   - Link: 250px
   - Status: 100px

5. **Center align numbers**:
   - Select columns D and E
   - Click center align

### Step 5: Data Validation (Recommended)

**For Category Column (A):**
1. Select column A (below header)
2. Data → Data validation
3. Criteria: List of items
4. Add: `Money, Items, Time`
5. On invalid data: Reject input
6. Save

**For Status Column (G):**
1. Select column G (below header)
2. Data → Data validation
3. Criteria: List of items
4. Add: `Active, Completed`
5. On invalid data: Reject input
6. Save

### Step 6: Share Settings

**For CSV Publish Method:**
1. File → Share → Publish to web
2. Select "Needs" tab
3. Choose "Comma-separated values (.csv)"
4. Click "Publish"
5. Copy the URL → paste into dashboard config

**For API Key Method:**
1. Click "Share" button (top right)
2. Change to "Anyone with the link"
3. Set permission to "Viewer"
4. Click "Done"
5. Copy Sheet ID from URL
6. Use with Google Sheets API key

### Step 7: Protect Sheet Structure (Optional)

To prevent accidental header deletion:
1. Select row 1
2. Data → Protect sheets and ranges
3. Set permissions: "Only you"
4. Click "Set permissions"

## Column Details

### Category
- **Purpose**: Determines which section the need appears in
- **Valid Values**: `Money`, `Items`, `Time` (case-insensitive)
- **Required**: Yes
- **Examples**: Money, Items, Time

### Title
- **Purpose**: The main headline donors see
- **Character Limit**: 50-60 characters ideal
- **Required**: Yes
- **Tips**: 
  - Start with $ amount for money needs
  - Include numbers for items (e.g., "120 Bags")
  - Be specific and action-oriented
- **Examples**:
  - `$1000 for November Food Fund`
  - `50 Winter Coats (Adult Sizes)`
  - `Weekend Food Program Volunteers`

### Description
- **Purpose**: Explains why this need matters
- **Character Limit**: 120-150 characters ideal
- **Required**: No (but strongly recommended)
- **Tips**:
  - Tell the impact story
  - Include who it helps
  - One or two sentences max
- **Examples**:
  - `Help provide emergency food assistance to 50 families`
  - `Keep neighbors warm through Louisville's cold season`
  - `Serve 200+ children during summer break`

### Target
- **Purpose**: The goal number
- **Format**: Numbers only - no $, commas, or decimals
- **Required**: Yes
- **Examples**:
  - `1000` (for $1,000)
  - `120` (for 120 items)
  - `12` (for 12 volunteer slots)

### Current
- **Purpose**: Progress toward target
- **Format**: Numbers only - no $, commas, or decimals
- **Required**: Yes (use 0 if starting fresh)
- **Update**: Change this as donations/volunteers come in
- **Examples**:
  - `750` (when you've raised $750 of $1000)
  - `90` (when you've collected 90 of 120 items)
  - `8` (when 8 of 12 volunteer slots are filled)

### Link
- **Purpose**: Where donors/volunteers should go
- **Format**: Full URL starting with https://
- **Required**: Yes
- **Examples**:
  - `https://slcm.org/donate`
  - `https://signupgenius.com/go/yourlink`
  - `https://forms.gle/yourform`

### Status
- **Purpose**: Controls visibility on dashboard
- **Valid Values**: 
  - `Active` - Shows on main dashboard
  - `Completed` - Moves to completed section
- **Required**: Yes
- **Auto-Complete**: Goal auto-completes when Current ≥ Target

## Tips for Success

### 1. Keep It Current
- Update progress at least weekly
- Mark completed goals promptly
- Remove outdated needs

### 2. Tell Stories
- Focus on impact, not just numbers
- Use real examples when possible
- Keep language positive and actionable

### 3. Test Your Links
- Click every link before adding
- Make sure they work on mobile
- Update broken links immediately

### 4. Use Consistent Formatting
- Follow the examples provided
- Keep descriptions similar length
- Use same link structure for similar needs

### 5. Plan Ahead
- Draft needs in advance
- Schedule updates for high-traffic times
- Coordinate with fundraising campaigns

## Sample Sheet Layout

```
| Category | Title                           | Description                              | Target | Current | Link                        | Status    |
|----------|----------------------------------|------------------------------------------|--------|---------|-----------------------------|-----------| 
| Money    | $1000 for November Food         | Help feed 50 families this month        | 1000   | 750     | https://slcm.org/donate     | Active    |
| Items    | 120 Bags Size 6/7 Diapers       | Essential supplies for families          | 120    | 90      | https://slcm.org/donate     | Active    |
| Time     | Rosewater Saturday Volunteers   | Serve meals Saturday mornings            | 12     | 8       | https://slcm.org/volunteer  | Active    |
| Money    | $500 Holiday Food Boxes         | Thanksgiving meals for 25 families       | 500    | 500     | https://slcm.org/donate     | Completed |
```

## Troubleshooting

**Dashboard not showing my need:**
- Check Category spelling (must be exactly: Money, Items, or Time)
- Verify Status is "Active"
- Make sure Target and Current are numbers only (no symbols)

**Progress bar wrong:**
- Remove $ signs and commas from Target/Current
- Check math: Current should be ≤ Target

**Goal not auto-completing:**
- Make sure Current equals or exceeds Target
- Both must be numbers without formatting

---

Need help? Check the STAFF_GUIDE.md or contact your administrator.
