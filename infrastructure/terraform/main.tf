terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.0"
    }
  }
  backend "gcs" {
    # Terraform state will be stored in GCS bucket
    # Initialize with: terraform init -backend-config="bucket=bigfam-terraform-state"
    bucket = "bigfam-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

resource "google_project_service" "services" {
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "compute.googleapis.com",
    "run.googleapis.com",
    "firestore.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    // "cloudmonitoring.googleapis.com", // Remove or comment out this line
    "cloudtrace.googleapis.com",
    "cloudprofiler.googleapis.com",
    "storage.googleapis.com",
    "firebase.googleapis.com"
  ])

  service            = each.key
  disable_on_destroy = false
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "bigfam-repo" {
  provider      = google-beta
  location      = var.region
  repository_id = "bigfam-repository"
  format        = "DOCKER"
  description   = "Docker repository for Big Fam Festival App"
  depends_on    = [google_project_service.services]
}

# Service account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "bigfam-cloud-run"
  display_name = "Big Fam Cloud Run Service Account"
  depends_on   = [google_project_service.services]
}

# IAM binding for service account
resource "google_project_iam_binding" "firestore_access" {
  project = var.project_id
  role    = "roles/datastore.user"
  members = [
    "serviceAccount:${google_service_account.cloud_run_sa.email}",
  ]
  depends_on = [google_service_account.cloud_run_sa]
}

resource "google_project_iam_binding" "storage_access" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  members = [
    "serviceAccount:${google_service_account.cloud_run_sa.email}",
  ]
  depends_on = [google_service_account.cloud_run_sa]
}

# VPC network for private connections (optional)
resource "google_compute_network" "vpc_network" {
  name                    = "bigfam-vpc-network"
  auto_create_subnetworks = true
  depends_on              = [google_project_service.services]
}

# Output important information
output "cloud_run_service_account" {
  value = google_service_account.cloud_run_sa.email
}

output "artifact_registry_repository" {
  value = google_artifact_registry_repository.bigfam-repo.name
}

output "vpc_network" {
  value = google_compute_network.vpc_network.name
}
