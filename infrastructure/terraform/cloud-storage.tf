# Cloud Storage bucket for file uploads (profiles, menus, etc.)
resource "google_storage_bucket" "user_uploads" {
  name          = "${var.project_id}-user-uploads-${var.environment}"
  location      = var.region
  force_destroy = var.environment != "production"
  
  uniform_bucket_level_access = true
  
  cors {
    origin          = [var.cors_origin]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["Content-Type", "Access-Control-Allow-Origin"]
    max_age_seconds = 3600
  }
  
  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "AbortIncompleteMultipartUpload"
    }
  }
  
  depends_on = [google_project_service.services]
}

# Cloud Storage bucket for static website hosting (if needed)
resource "google_storage_bucket" "static_website" {
  name          = "${var.project_id}-website-${var.environment}"
  location      = var.region
  force_destroy = var.environment != "production"
  
  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["Content-Type", "Access-Control-Allow-Origin"]
    max_age_seconds = 3600
  }
  
  depends_on = [google_project_service.services]
}

# Make the user uploads bucket publicly readable
resource "google_storage_bucket_iam_member" "user_uploads_public" {
  bucket = google_storage_bucket.user_uploads.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Make the static website bucket publicly readable
resource "google_storage_bucket_iam_member" "static_website_public" {
  bucket = google_storage_bucket.static_website.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Output the bucket names
output "user_uploads_bucket" {
  value = google_storage_bucket.user_uploads.name
}

output "static_website_bucket" {
  value = google_storage_bucket.static_website.name
}

output "user_uploads_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.user_uploads.name}"
}

output "static_website_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.static_website.name}"
}
