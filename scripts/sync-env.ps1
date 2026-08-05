# Syncs Vercel development env into local .env (keeps DATABASE_URL/DIRECT_URL from .env if pull omits them).
# Usage: powershell -File scripts/sync-env.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

vercel env pull .env.vercel --environment=development --yes | Out-Null

$keep = @{}
if (Test-Path .env) {
  Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $n, $v = $_.Split('=', 2)
    $keep[$n] = $v
  }
}

$fromVercel = @{}
Get-Content .env.vercel | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $n, $v = $_.Split('=', 2)
  $v = $v.Trim('"')
  if ($n -eq 'VERCEL_OIDC_TOKEN') { return }
  $fromVercel[$n] = $v
}

foreach ($k in $fromVercel.Keys) { $keep[$k] = $fromVercel[$k] }

$order = @(
  'DATABASE_URL','DIRECT_URL','SESSION_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD',
  'NEXT_PUBLIC_APP_URL','DOUBLETICK_API_KEY','DOUBLETICK_FROM','CRON_SECRET','SUPABASE_PROJECT_REF'
)
$lines = @()
foreach ($k in $order) {
  if ($keep.ContainsKey($k)) { $lines += "$k=$($keep[$k])"; $keep.Remove($k) }
}
foreach ($k in ($keep.Keys | Sort-Object)) { $lines += "$k=$($keep[$k])" }
$lines | Set-Content .env -Encoding utf8
Write-Output "Updated .env from Vercel development env."
