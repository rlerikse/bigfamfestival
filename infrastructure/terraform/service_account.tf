# Reference existing service account instead of creating a new one
data "google_service_account" "bigfam_cloud_run" {
  account_id = "bigfam-cloud-run"
}

# Grant access to the JWT secret
resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  project   = "bigfamfestival"  # Replace with var.project_id if you have it defined
  secret_id = "jwt-secret"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_service_account.bigfam_cloud_run.email}"
}

# Assign the service account to the Cloud Run service
# This assumes you're managing the Cloud Run service with Terraform
# If not, you'll need to update it manually
resource "google_cloud_run_service_iam_binding" "service_account_binding" {
  location = "us-central1"  # Match your service region
  service  = "bigfam-api-development" 
  role     = "roles/run.invoker"
  members  = [
    "serviceAccount:${data.google_service_account.bigfam_cloud_run.email}",
  ]
}

# Output the proper command to use
output "correct_iam_command" {
  value = "gcloud secrets add-iam-policy-binding jwt-secret --member=\"serviceAccount:${data.google_service_account.bigfam_cloud_run.email}\" --role=\"roles/secretmanager.secretAccessor\""
  description = "Copy and paste this command without the outer quotes"
}
