# Reference existing service account instead of creating a new one
data "google_service_account" "bigfam_cloud_run" {
  account_id = "bigfam-cloud-run"
}

# Assign the service account to the Cloud Run service
# This assumes you're managing the Cloud Run service with Terraform
# If not, you'll need to update it manually
resource "google_cloud_run_service_iam_binding" "service_account_binding" {
  location = "us-central1"  # Match your service region
  service  = "bigfam-api-production" 
  role     = "roles/run.invoker"
  members  = [
    "serviceAccount:${data.google_service_account.bigfam_cloud_run.email}",
  ]
}
