# Ensure the Cloud Monitoring API is enabled
resource "google_project_service" "monitoring" {
  service = "monitoring.googleapis.com"
  disable_on_destroy = false
}

# Update all monitoring resources to depend on this API enablement
