output "service_name" {
  value = aws_ecs_service.stub.name
}

output "image_repository_url" {
  description = "Push the nginx image here (tagged with var.image_tag) so the stub can pull it."
  value       = aws_ecr_repository.stub.repository_url
}

output "cluster_arn" {
  value = aws_ecs_cluster.stub.arn
}

output "vpc_id" {
  value = data.aws_vpc.network.id
}
