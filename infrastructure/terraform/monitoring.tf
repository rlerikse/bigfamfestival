# Custom alerting policy for high error rate
resource "google_monitoring_alert_policy" "high_error_rate" {
  depends_on = [google_project_service.monitoring, time_sleep.wait_for_metrics]
  display_name = "BigFam API High Error Rate Alert"
  combiner     = "OR"
  conditions {
    display_name = "Error rate > 5%"
    condition_threshold {
      filter     = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"bigfam-api-production\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"4xx\" OR metric.labels.response_code_class = \"5xx\""
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
      denominator_filter = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"bigfam-api-production\" AND metric.type = \"run.googleapis.com/request_count\""
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

}

resource "time_sleep" "wait_for_metrics" {
  create_duration = "5m"
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
                  "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"bigfam-api-production\" AND metric.type=\"run.googleapis.com/request_count\"",
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
                  "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"bigfam-api-production\" AND metric.type=\"run.googleapis.com/request_count\" AND (metric.labels.response_code_class=\"4xx\" OR metric.labels.response_code_class=\"5xx\")",
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
      }
    ]
  }
}
EOF

  depends_on = [google_project_service.monitoring, time_sleep.wait_for_metrics]
}
