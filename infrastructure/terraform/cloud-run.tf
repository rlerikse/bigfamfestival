# Cloud Run service for backend API
resource "google_cloud_run_service" "bigfam-api" {
  name     = "bigfam-api-${var.environment}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      containers {
        # ✅ FIXED: Use the actual backend image
        image = var.backend_image

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

        env {
          name  = "STORAGE_BUCKET"
          value = "${var.project_id}.appspot.com"
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

        # Optional: Add Google Application Credentials if needed
        # env {
        #   name = "GOOGLE_APPLICATION_CREDENTIALS"
        #   value_from {
        #     secret_key_ref {
        #       name = "google-application-credentials"
        #       key  = "latest"
        #     }
        #   }
        # }
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

# Output the service URL
output "service_url" {
  value = google_cloud_run_service.bigfam-api.status[0].url
}