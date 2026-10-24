# Deploying Study Buddy to Namecheap

The live site is on Namecheap shared hosting (cPanel). `.github/workflows/deploy.yml` uploads it by FTP over TLS every time `main` changes. Netlify still builds the free pull-request previews.

## One-time setup (the owner does these)
1. **Subdomain:** cPanel > Domains (or Subdomains) > create, for example `study.yourdomain.com`. Note the folder it uses.
2. **HTTPS:** cPanel > SSL/TLS Status > run AutoSSL for the subdomain. Wait until it shows a padlock. The site needs https for offline mode.
3. **FTP account:** cPanel > FTP Accounts > create one. Set its Directory to the subdomain's folder, so it can reach nothing else.
4. **GitHub secrets:** repository > Settings > Secrets and variables > Actions > New repository secret, three times:
   - `FTP_SERVER`: the FTP hostname from the cPanel FTP Accounts page ("Configure FTP Client")
   - `FTP_USERNAME`: the full FTP username, such as `deploy@study.yourdomain.com`
   - `FTP_PASSWORD`: its password
5. **First upload:** Actions tab > Deploy to Namecheap > Run workflow.

## How it works
The workflow runs `node study-buddy/_dev/build.mjs`, copies `study-buddy/` without `_dev`, adds `_dev/deploy/htaccess.txt` as `.htaccess` (https redirect, no cache for `sw.js`), and uploads only the files that changed. The tool keeps a small state file on the server to know what to delete. If the deploy fails, the old site stays up.

## If something goes wrong
- Login error: check the three secrets, and that the FTP account is allowed on the server hostname.
- Site shows an old version: wait a minute, then reload twice (the offline worker updates in the background).
- Blank page or 500 error: look at `.htaccess` first. Delete it through File Manager and the site will still load without https redirect and cache rules.
