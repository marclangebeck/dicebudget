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

```bash
mkdir -p ~/projects
cd ~/projects
git clone git@github.com:DEIN_USER/REPO.git kniffel
cd kniffel/frontend
npm install
npm run build:ios
npx cap open ios
```

## 4. Nach Änderungen

**Server oder Mac:**

```bash
git add -A
git commit -m "Beschreibung der Änderung"
git push
```

**Auf dem Mac vor Xcode:** `git pull` → `npm run build:ios`

## Nicht im Repo

| Datei | Grund |
|-------|--------|
| `backend/prisma/**/*.db` | Lokale Daten |
| `frontend/.env.production` | Server-spezifisch (lokal aus `.env.production.example` anlegen) |
| `node_modules/`, `frontend/out/` | Build-Artefakte |
