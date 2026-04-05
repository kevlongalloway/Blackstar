# GitHub Actions Setup Guide

## What the Workflow Does

The `.github/workflows/scrape-products.yml` file automatically:
1. Runs the Shopify scraper (`scraper.js`)
2. Fetches products from your Shopify store
3. Updates `products.json` with new product data
4. Commits and pushes changes back to your repo
5. Runs on schedule (daily at 2 AM UTC) or manually on-demand

## Prerequisites

1. **Push code to GitHub**
   ```bash
   git push origin claude/scrape-shopify-products-wG57x
   ```

2. **Enable GitHub Actions**
   - Go to your repo on GitHub
   - Click "Actions" tab
   - If prompted, enable Actions for this repo

## How to Run Manually

### Method 1: GitHub Web Interface (Easiest)

1. Go to your repo: `https://github.com/kevlongalloway/Blackstar`
2. Click the **Actions** tab
3. On the left, select **"Scrape Shopify Products"** workflow
4. Click the blue **"Run workflow"** dropdown button
5. Click **"Run workflow"** again to confirm
6. Watch the job run in real-time

### Method 2: GitHub CLI (Command Line)

If you have the GitHub CLI installed:

```bash
# List available workflows
gh workflow list

# Run the scraper workflow manually
gh workflow run scrape-products.yml

# View recent workflow runs
gh run list

# Check the status of the latest run
gh run view
```

## Monitoring the Workflow

### On GitHub Web

1. Go to **Actions** tab
2. Click the latest run under "Scrape Shopify Products"
3. See real-time output:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Run scraper
   - ✅ Commit and push
4. Check for errors or success messages

### What Happens on Success

- ✅ Products fetched from Shopify
- ✅ `products.json` updated with new data
- ✅ Auto-commit: "Update products from Shopify scraper"
- ✅ Changes pushed to your branch
- ✅ Render automatically redeploys with new products

### What Happens on Failure

- ❌ Error message shown in workflow logs
- ❌ No commit made (products.json unchanged)
- ❌ You can click on the failed step to see the error

## Troubleshooting

### Workflow doesn't appear in Actions

**Solution:**
1. Push the code to GitHub first
2. Commit the `.github/workflows/scrape-products.yml` file
3. Wait a few seconds, refresh the Actions tab

### Scraper fails: "Cannot find module 'https'"

**Solution:** The `https` module is built into Node.js, should never happen. Check:
- Node.js version is 18+ (workflow specifies v18)
- `scraper.js` file exists in the repo root

### Scraper fails: "getaddrinfo EAI_AGAIN"

**Solution:** Network issue connecting to Shopify
- Check the Shopify store URL is correct
- Verify Shopify `/products.json` endpoint is accessible
- Try manually: `curl https://blackstarthebrand.myshopify.com/products.json`

### Scraper times out

**Solution:** Increase timeout or check network
- The scraper has a 10-second timeout
- If Shopify is slow, increase the timeout in `scraper.js` line 32

## Automatic Schedule

The workflow also runs automatically:
- **Time:** Daily at 2 AM UTC
- **Cron expression:** `0 2 * * *`
- **Timezone:** UTC (use [crontab.guru](https://crontab.guru) to convert)

To change the schedule, edit `.github/workflows/scrape-products.yml`:
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Change this line
```

Example schedules:
- Every hour: `'0 * * * *'`
- Every 6 hours: `'0 0,6,12,18 * * *'`
- Every day at 9 AM UTC: `'0 9 * * *'`
- Every Monday at 8 AM UTC: `'0 8 * * 1'`

## Workflow Details

### Triggers

1. **Schedule:** Runs daily at 2 AM UTC
2. **Manual:** Click "Run workflow" on the Actions page
3. **Push:** (Optional) Can add `on: push` to run on every commit

### Environment

- **Runner:** `ubuntu-latest` (free GitHub-hosted runner)
- **Node.js:** Version 18 (latest stable)

### Permissions

The workflow needs:
- ✅ Read code (`actions/checkout`)
- ✅ Run Node.js
- ✅ Write to repo (`git push`)

All permissions are automatically granted for GitHub Actions in your own repo.

## Next Steps

1. **Test manually:** Run the workflow once to confirm it works
2. **Monitor logs:** Check the Actions tab to see what happened
3. **Wait for Render:** The products will update on your live site automatically
4. **Schedule tweaks:** Adjust the cron schedule if needed

## Questions?

- **GitHub Actions docs:** https://docs.github.com/actions
- **Cron syntax:** https://crontab.guru
- **Workflow logs:** Go to Actions tab → click the run → expand failed steps
