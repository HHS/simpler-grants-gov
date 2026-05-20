resource "aws_security_group" "lambda" {
  name        = "${var.name}-lambda"
  description = "ClamAV scanner and freshclam Lambdas"
  vpc_id      = var.vpc_id

  egress {
    description = "Allow all egress (S3, ClamAV mirrors for freshclam, EFS)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "efs" {
  name        = "${var.name}-efs"
  description = "Allow NFS from ClamAV Lambdas"
  vpc_id      = var.vpc_id

  ingress {
    description     = "NFS from ClamAV Lambdas"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }
}

resource "aws_efs_file_system" "clamav" {
  encrypted = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = {
    Name = var.name
  }
}

resource "aws_efs_mount_target" "clamav" {
  for_each = toset(var.private_subnet_ids)

  file_system_id  = aws_efs_file_system.clamav.id
  subnet_id       = each.value
  security_groups = [aws_security_group.efs.id]
}

resource "aws_efs_access_point" "clamav" {
  file_system_id = aws_efs_file_system.clamav.id

  # Lambda mounts as this UID/GID. Matches what the Python handlers run as.
  posix_user {
    uid = 1000
    gid = 1000
  }

  # Root the access point at /clamav inside the file system so we can carve
  # out other directories on the same volume later if we need to.
  root_directory {
    path = "/clamav"
    creation_info {
      owner_uid   = 1000
      owner_gid   = 1000
      permissions = "0755"
    }
  }
}
