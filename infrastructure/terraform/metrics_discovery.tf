# Instructions for viewing Cloud Run metrics
output "cloud_run_metrics_instructions" {
  value = <<EOF
To view available metrics for Cloud Run:

1. Visit the Google Cloud Console Metrics Explorer:
   https://console.cloud.google.com/monitoring/metrics-explorer?project=bigfamfestival

2. In the Metrics Explorer:
   - Click "Select a metric"
   - In the filter box, type "Cloud Run"
   - Select "Cloud Run Revision" as the resource type
   - Browse available metrics and note their names for use in Terraform

3. For CPU and memory metrics, look for metrics with names like:
   - container/cpu/utilization
   - container/memory/utilization
   - or similar variations

4. Alternative CLI approach:
   gcloud beta monitoring metrics list --filter="metric.type=~run.googleapis.com"
EOF
  description = "Instructions to discover available Cloud Run metrics"
}

# Alternative command using monitoring API directly
output "monitoring_api_command" {
  value = <<EOF
curl -X GET \\
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \\
  "https://monitoring.googleapis.com/v3/projects/bigfamfestival/metricDescriptors?filter=resource.type%3Dcloud_run_revision"
EOF
  description = "API command to list available metrics"
}

# Output specifically looking for CPU and memory metrics
output "cpu_memory_metrics_command" {
  value = "gcloud monitoring metrics list --filter=\"resource.type=cloud_run_revision AND metric.name:cpu OR metric.name:memory\" --project=bigfamfestival"
  description = "Run this command to find CPU and memory related metrics"
}
