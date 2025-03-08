# Reference the existing Cloud Run service instead of creating a new one
data "google_cloud_run_service" "bigfam_api" {
  name     = "bigfam-api-development"
  location = "us-central1"
}

# Use this data source in the monitoring configuration instead of the resource
