# Cloud Run service for backend API
resource "google_cloud_run_service" "bigfam-api" {
  name     = "bigfam-api-${var.environment}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      containers {
        # image = var.backend_image
        image = "gcr.io/cloudrun/hello"  # Public sample image from Google

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
        
        env {
          name  = "NODE_ENV"
          value = var.environment
        }
        
        env {
          name  = "GOOGLE_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "CORS_ORIGIN"
          value = var.cors_origin
        }
        
        # Secrets (should be managed separately and referred here)
        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = "jwt-secret"
              key  = "latest"
            }
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.services,
    google_service_account.cloud_run_sa
  ]
}

# Make the Cloud Run service publicly accessible
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.bigfam-api.name
  location = google_cloud_run_service.bigfam-api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run custom domain mapping (optional, uncomment if needed)
# resource "google_cloud_run_domain_mapping" "api_domain" {
#   name     = "api.bigfamfestival.com"
#   location = var.region
#   metadata {
#     namespace = var.project_id
#   }
#   spec {
#     route_name = google_cloud_run_service.bigfam-api.name
#   }
# }

# Output the service URL
output "service_url" {
  value = google_cloud_run_service.bigfam-api.status[0].url
}
