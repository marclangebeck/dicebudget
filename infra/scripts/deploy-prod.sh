#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== Kniffel Produktion: Backend + Frontend + Nginx ==="
bash "$ROOT/infra/scripts/deploy-backend-prod.sh"
bash "$ROOT/infra/scripts/deploy-frontend-prod.sh"

echo ""
echo "=== Alles deployt: https://dicebudget.bottle-trade.de ==="
