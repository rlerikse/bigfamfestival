# Custom alerting policy for high error rate
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "BigFam API High Error Rate Alert"
  combiner     = "OR"
  conditions {
    display_name = "Error rate > 5%"
    condition_threshold {
      filter     = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_service.bigfam-api.name}\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"4xx\" OR metric.labels.response_code_class = \"5xx\""
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
      comparison = "COMPARISON_GT"
      duration   = "60s"
      trigger {
        count = 1
      }
      threshold_value = 0.05
      denominator_filter = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_service.bigfam-api.name}\" AND metric.type = \"run.googleapis.com/request_count\""
      denominator_aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [] # Add notification channels here if needed

  documentation {
    content   = "The error rate for the BigFam API has exceeded 5% over the last minute. Please check the logs and metrics."
    mime_type = "text/markdown"
  }

  depends_on = [google_cloud_run_service.bigfam-api]
}

# CPU utilization alerting policy
resource "google_monitoring_alert_policy" "high_cpu_utilization" {
  display_name = "BigFam API High CPU Utilization"
  combiner     = "OR"
  conditions {
    display_name = "CPU utilization > 80%"
    condition_threshold {
      filter     = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_service.bigfam-api.name}\" AND metric.type = \"run.googleapis.com/container/cpu/utilization\""
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_99"
      }
      comparison      = "COMPARISON_GT"
      duration        = "60s"
      threshold_value = 0.8
    }
  }

  notification_channels = [] # Add notification channels here if needed

  documentation {
    content   = "CPU utilization for the BigFam API has exceeded 80% over the last minute. Consider scaling up the service."
    mime_type = "text/markdown"
  }

  depends_on = [google_cloud_run_service.bigfam-api]
}

# Memory utilization alerting policy
resource "google_monitoring_alert_policy" "high_memory_utilization" {
  display_name = "BigFam API High Memory Utilization"
  combiner     = "OR"
  conditions {
    display_name = "Memory utilization > 80%"
    condition_threshold {
      filter     = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_service.bigfam-api.name}\" AND metric.type = \"run.googleapis.com/container/memory/utilization\""
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_99"
      }
      comparison      = "COMPARISON_GT"
      duration        = "60s"
      threshold_value = 0.8
    }
  }

  notification_channels = [] # Add notification channels here if needed

  documentation {
    content   = "Memory utilization for the BigFam API has exceeded 80% over the last minute. Consider scaling up the service."
    mime_type = "text/markdown"
  }

  depends_on = [google_cloud_run_service.bigfam-api]
}

# Cloud Monitoring Dashboard
resource "google_monitoring_dashboard" "bigfam_dashboard" {
  dashboard_json = <<EOF
{
  "displayName": "BigFam Festival App Dashboard",
  "gridLayout": {
    "widgets": [
      {
        "title": "API Request Count",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_service.bigfam-api.name}\" AND metric.type=\"run.googleapis.com/request_count\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              },
              "plotType": "LINE"
            }
          ]
        }
      },
      {
        "title": "Error Rate",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_service.bigfam-api.name}\" AND metric.type=\"run.googleapis.com/request_count\" AND (metric.labels.response_code_class=\"4xx\" OR metric.labels.response_code_class=\"5xx\")",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              },
              "plotType": "LINE"
            }
          ]
        }
      },
      {
        "title": "CPU Utilization",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_service.bigfam-api.name}\" AND metric.type=\"run.googleapis.com/container/cpu/utilization\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_99"
                  }
                }
              },
              "plotType": "LINE"
            }
          ]
        }
      },
      {
        "title": "Memory Utilization",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_service.bigfam-api.name}\" AND metric.type=\"run.googleapis.com/container/memory/utilization\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_99"
                  }
                }
              },
              "plotType": "LINE"
            }
          ]
        }
      }
    ]
  }
}
EOF

  depends_on = [google_cloud_run_service.bigfam-api]
}
