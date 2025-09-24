# Commit: Add deploy-backend.ps1 to build and deploy backend to Cloud Run via Artifact Registry and Terraform
# Author: (unknown)
# Date: 2025-09-24

param(
  [Parameter(Mandatory=$true)] [string]$ProjectId,
  [string]$Region = "us-central1",
  [string]$Repository = "bigfam-repository",
  [string]$ImageName = "bigfam-backend",
  [ValidateSet("production","staging","development")] [string]$Environment = "production",
  [string]$ServiceName = "bigfam-api-production",
  [switch]$SkipBuild,
  [switch]$AutoApprove
)

$ErrorActionPreference = "Stop"

function Run-Step($label, $script) {
  Write-Host "==> $label" -ForegroundColor Cyan
  & $script
  if ($LASTEXITCODE -ne 0) { throw "$label failed with exit code $LASTEXITCODE" }
}

# Paths (resolve repo root two levels up from this script directory)
$repoRoot = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') '..')).Path
$backendPath = Join-Path $repoRoot 'backend'
$tfPath = Join-Path $repoRoot 'infrastructure/terraform'

# Validate paths exist
if (-not (Test-Path $backendPath)) {
  throw "Backend path not found: $backendPath"
}
if (-not (Test-Path $tfPath)) {
  throw "Terraform path not found: $tfPath"
}

# Ensure required CLIs are available
foreach ($cmd in @("gcloud","terraform","npm")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $cmd"
  }
}

# Configure gcloud
Run-Step "Set gcloud project" { gcloud config set project $ProjectId | Out-Null }
Run-Step "Configure Artifact Registry auth" { gcloud auth configure-docker "$Region-docker.pkg.dev" -q }

# Build backend and container image
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
# Use ${} to delimit variables to avoid parsing issues (e.g., ${ImageName}:${timestamp})
$imagePath = "${Region}-docker.pkg.dev/${ProjectId}/${Repository}/${ImageName}:${timestamp}"

if (-not $SkipBuild) {
  Push-Location $backendPath
  try {
    Run-Step "Install backend dependencies" { npm ci }
    Run-Step "Typecheck backend" { npm run typecheck }
    Run-Step "Build backend" { npm run build }
  } finally { Pop-Location }

  Run-Step "Build & push image with Cloud Build" { gcloud builds submit "$backendPath" --tag "$imagePath" }
} else {
  Write-Host "Skipping build as requested; expecting existing image tag provided via parameters" -ForegroundColor Yellow
}

# Terraform deploy
Push-Location $tfPath
try {
  Run-Step "Terraform init" { terraform init -input=false }
  $applyArgs = @("-var=project_id=$ProjectId","-var=region=$Region","-var=environment=$Environment","-var=backend_image=$imagePath")
  if ($AutoApprove) { $applyArgs += "-auto-approve" }
  # In PowerShell 5.1, pass array args without splatting syntax
  Run-Step "Terraform apply" { terraform apply $applyArgs }
} finally { Pop-Location }

Write-Host "\nDeployment complete." -ForegroundColor Green
Write-Host "Image: $imagePath"
Write-Host "Cloud Run service: $ServiceName (region: $Region)"
Write-Host "Tip: To verify health: curl https://$ServiceName-$ProjectId.$Region.run.app/api/v1/health"