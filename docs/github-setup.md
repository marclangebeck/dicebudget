# GitHub einrichten (dice.budget / kniffel)

## Auf dem Server (erledigt)

- Git-Repository in `/home/bottleadmin/projects/kniffel`
- Branch `main`, Initial-Commit mit Quellcode (ohne `node_modules`, ohne `.db`)

## 1. Neues Repository auf GitHub

1. https://github.com/new
2. **Repository name:** z. B. `dicebudget` oder `kniffel`
3. **Private** empfohlen (Spiel + Infrastruktur)
4. **Kein** README / .gitignore / License hinzufügen (haben wir lokal schon)
5. **Create repository**

## 2. Push vom Server

URL anpassen (`DEIN_USER`, `REPO`):

```bash
cd /home/bottleadmin/projects/kniffel

git remote add origin git@github.com:DEIN_USER/REPO.git
# oder HTTPS:
# git remote add origin https://github.com/DEIN_USER/REPO.git

git push -u origin main
```

**SSH:** Schlüssel muss auf GitHub hinterlegt sein (`Settings → SSH keys`).

**HTTPS:** Personal Access Token als Passwort verwenden.

## 3. Auf dem Mac (für Xcode)

Aktiver Branch: **`milestone-22-prep`**

```bash
mkdir -p ~/projects
cd ~/projects
git clone git@github.com:marclangebeck/dicebudget.git kniffel
cd kniffel
git checkout milestone-22-prep
cd frontend
npm install
npm run build:ios
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

## 4. Nach Änderungen

**Server:**

```bash
cd /home/bottleadmin/projects/kniffel
git add … && git commit -m "…" && git push origin milestone-22-prep
sudo bash infra/scripts/deploy-frontend-prod.sh   # Web
```

**Mac vor Xcode:**

```bash
cd ~/projects/kniffel && git pull origin milestone-22-prep
cd frontend && npm run build:ios
# Build-Nummer in Xcode erhöhen → Archive → Upload
# Bei Copy failed: brew unlink rsync
```

## Nicht im Repo

| Datei | Grund |
|-------|--------|
| `backend/prisma/**/*.db` | Lokale Daten |
| `frontend/.env.production` | Server-spezifisch (lokal aus `.env.production.example` anlegen) |
| `node_modules/`, `frontend/out/` | Build-Artefakte |
