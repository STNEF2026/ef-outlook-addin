# EF Conversations — Outlook add-in

This add-in puts an **Add conversation** button in the Outlook compose window. The button opens a side panel where you can search every conversation published on executiveforecast.com and insert one or more of them at the cursor. The cards look like the CRM's "Conversation Preview" cards: photo, the line "Executive Forecast — Conversation", the headline linked to the interview, a pull quote you can edit, and Name — Role, Company.

It needs no login. It reads the website's public conversation list, the same one the /conversations page uses.

## What's in the folder

| File | What it is |
|---|---|
| `taskpane.html` | The side panel: search, selection, options, preview, Insert and Copy. |
| `commands.html` | An empty page that Outlook requires. |
| `assets/` | The button icons. |
| `manifest.template.xml` | The add-in definition. Its `{{HOST}}` placeholder is filled in by `make_manifest.py`. |
| `manifest.xml` | Already built for `https://executiveforecast.com/outlook-addin`. |
| `make_manifest.py` | Rebuilds `manifest.xml` for a different host. |
| `scripts/fetch_conversations.mjs` | Builds `conversations.json`. You only need it for Option B. |
| `.github/workflows/refresh-conversations.yml` | Runs that script every night on GitHub. You only need it for Option B. |

## Step 1: put the files on an https address (pick one option)

Outlook loads the panel from a web address, so these files have to be hosted somewhere. Browsers stop other websites from reading executiveforecast.com's data, which is why where you host them matters.

**Option A (recommended): host on executiveforecast.com.**
The website is a Next.js app on Vercel. Whoever deploys it copies these files into `public/outlook-addin/`:

- `taskpane.html`
- `commands.html`
- `assets/`

Once deployed, `https://executiveforecast.com/outlook-addin/taskpane.html` should open. The search is then live: a conversation published today can be found straight away, and the quote comes from the interview page. `manifest.xml` is already built for this address.

**Option B: host on GitHub Pages, with no change to the website.**
1. Push this folder to a GitHub repository and turn on Pages for it (Settings → Pages → Deploy from branch → main / root).
2. Put `conversations.json` in the repository: about 1,400 conversations including their quotes. The **Refresh conversation list** workflow under Actions was meant to rebuild it every night, but executiveforecast.com's bot protection turns away requests from GitHub's servers. So for now the list is rebuilt from a normal browser on the website, by asking Claude to refresh it. Once the website allows the refresh, or simply hosts the add-in (Option A), the list updates by itself.
3. Run `python3 make_manifest.py https://<user>.github.io/<repo>` to rebuild `manifest.xml` for that address.

The add-in chooses its mode by itself. When it is served from executiveforecast.com it searches live; anywhere else it reads `conversations.json`.

## Step 2: add it to Outlook on the web

1. Open https://aka.ms/olksideload. Outlook opens the **Add-ins for Outlook** window.
2. Go to **My add-ins** → **Custom add-ins** → **Add a custom add-in** → **Add from file…**, and choose `manifest.xml`.
3. Start a new email or reply. Open the **Apps** button (or the "…" menu) in the message toolbar and choose **Executive Forecast → Add conversation**. In Outlook on the web you can pin the button to the toolbar.

To give the whole team the add-in, an M365 admin can deploy the same `manifest.xml` from the Microsoft 365 admin centre (Settings → Integrated apps → Upload custom apps).

## Using it

- Type a name, company, country or topic. The list shows the newest conversations first.
- Click a result to add it to the tray (up to 6). Click it again to remove it. You can reorder the tray, and you can edit or clear each quote.
- Options:
  - layout: one card per row, or two per row
  - the line "For reference, we recently met with:"
- Photos are always included.
- **Insert at cursor** puts the cards where your cursor is in the draft. **Copy** puts formatted cards on the clipboard, which you can paste into any email. Copy also works if you open `taskpane.html` in an ordinary browser tab.

## Notes

- The photos are the website's own `.webp` images. Outlook on the web, new Outlook, Apple Mail and Gmail show them. Classic Outlook for Windows may show an empty box for them.
- Quotes come from each interview page's summary line, which can end in "…". Edit them in the tray if you want a cleaner cut.
