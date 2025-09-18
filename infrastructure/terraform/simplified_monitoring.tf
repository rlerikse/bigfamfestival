# Basic monitoring setup with standard metrics
resource "google_monitoring_alert_policy" "service_availability" {
  display_name = "BigFam API Availability"
  combiner     = "OR"
  conditions {
    display_name = "Uptime check failed"
    condition_threshold {
      filter     = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"bigfam-api-production\" AND metric.type = \"run.googleapis.com/request_count\""
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_SUM"
      }
      comparison      = "COMPARISON_LT"
      duration        = "300s"
      threshold_value = 1
    }
  }

  documentation {
    content   = "The BigFam API may be unavailable."
    mime_type = "text/markdown"
  }
  
  depends_on = [google_project_service.monitoring, time_sleep.wait_for_metrics]
}
