# Enable Firestore API
resource "google_app_engine_application" "app" {
  project       = var.project_id
  location_id   = "us-central" # Firestore requires App Engine
  database_type = "CLOUD_FIRESTORE"
  depends_on    = [google_project_service.services]
}

# Firestore indexes for queries
resource "google_firestore_index" "users_by_email" {
  collection  = "users"
  depends_on  = [google_app_engine_application.app]

  fields {
    field_path = "email"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "events_by_stage" {
  collection  = "events"
  depends_on  = [google_app_engine_application.app]

  fields {
    field_path = "stage"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "startTime"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "tickets_by_user" {
  collection  = "tickets"
  depends_on  = [google_app_engine_application.app]

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "campsites_by_user" {
  collection  = "campsites"
  depends_on  = [google_app_engine_application.app]

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "sharedWithFriends"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "friend_requests_by_status" {
  collection  = "friendRequests"
  depends_on  = [google_app_engine_application.app]

  fields {
    field_path = "targetUserId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}
