# Destroy infrastructure

To destroy everything you'll need to undeploy all the infrastructure in reverse order that they were created. In particular, the account root module(s) need to be destroyed last.

## Instructions

1. First, destroy all your environments. Within `/infra/<APP_NAME>/service` run the following, replacing `dev` with the environment you're destroying.

   ```bash
   $ terraform init --backend-config=dev.s3.tfbackend
   $ terraform destroy -var-file=dev.tfvars
   ```

2. Then to destroy the backends, first you'll need to add `force_destroy = true` to the S3 buckets, and update the lifecycle block to set `prevent_destroy = false`. Then run `terraform apply` from within the `infra/accounts` directory. The reason we need to do this is because S3 buckets by default are protected from destruction to avoid loss of data. See [Terraform: Destroy/Replace Buckets](https://medium.com/interleap/terraform-destroy-replace-buckets-cf9d63d0029d) for a more in-depth explanation.

   ```terraform
   # infra/modules/modules/terraform-backend-s3/main.tf

   resource "aws_s3_bucket" "tf_state" {
     bucket = var.state_bucket_name

     force_destroy = true

     # Prevent accidental destruction a developer executing terraform destory in the wrong directory. Contains terraform state files.
     lifecycle {
       prevent_destroy = false
     }
   }

   ...

   resource "aws_s3_bucket" "tf_log" {
     bucket = var.tf_logging_bucket_name
     force_destroy = true
   }
   ```

3. Then since we're going to be destroying the tfstate buckets, you'll want to move the tfstate file out of S3 and back to your local system. Comment out or delete the s3 backend configuration:

   ```terraform
   # infra/accounts/main.tf

   # Comment out or delete the backend block
   backend "s3" {
     ...
   }
   ```

4. Then run the following from within the `infra/accounts` directory to copy the `tfstate` back to a local `tfstate` file:

   ```bash
   terraform init -force-copy
   ```

5. Finally, you can run `terraform destroy` within the `infra/accounts` directory.

   ```bash
   terraform destroy
   ```
