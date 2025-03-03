variable "project_id" {
  description = "The Google Cloud project ID"
  type        = string
  # Set default or use terraform.tfvars file
  # default   = "bigfam-festival-app"
}

variable "region" {
  description = "The Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The Google Cloud zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "The environment (development, staging, production)"
  type        = string
  default     = "development"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "backend_image" {
  description = "The Docker image for the backend service"
  type        = string
  default     = "us-central1-docker.pkg.dev/bigfam-festival-app/bigfam-repository/bigfam-backend:latest"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "cors_origin" {
  description = "CORS allowed origin"
  type        = string
  default     = "*"
}
