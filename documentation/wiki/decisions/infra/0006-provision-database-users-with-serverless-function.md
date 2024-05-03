# Provision database users with serverless function

* Status: proposed
* Deciders: @lorenyu @kyeah @shawnvanderjagt @rocketnova
* Date: 2023-05-25

## Context and Problem Statement

What is the best method for setting up database users and permissions for the application service and the migrations task?

## Decision Drivers

* Minimize number of steps
* Security and compliance

## Considered Options

* **Terraform** – Define users and permissions declaratively in Terraform using the [PostgreSQL provider](https://registry.terraform.io/providers/cyrilgdn/postgresql/latest/docs). Apply changes from infrastructure engineer's local machine or from the CI/CD workflow. When initially creating database cluster, make database cluster publicly accessible and define security group rules to allow traffic from local machine or GitHub actions. After creating database users, reconfigure database cluster to make database private.
* **Shell scripts** – Define users and permissions through a shell script. This could use tools like psql or not. It could also define the permissions in a `.sql` file that gets executed. Similar to the terraform option, the database would need to be made accessible to the machine running the script. One way to do this is for the script itself to temporarily enable access to the database using AWS CLI.
* **Jump host using EC2** – Run terraform or a shell script but from an EC2 instance within the VPC. Create the EC2 instance and set up network connectivity between the EC2 instance and the database cluster as part of creating the database infrastructure resources.
* **Container task using ECS** – Build a Docker image that has the code and logic to provision users and permissions and run the code as an ECS task.
* **Serverless function using Lambda** – Write code to provision database users and permissions and run it as a Lambda function.

### Decision Outcome: AWS Lambda function

A Lambda function is the simplest tool that can operate within the VPC and therefore get around the obstacle of needing network access to the database cluster. EC2 instances are too expensive to maintain for rarely used operations like database user provisioning, and ECS tasks add complexity to the infrastructure by requiring an additional ECR image repository and image build step.

## Pros and Cons of the Options

### Terraform

Pros

* Declarative
* Could create database cluster and database users in a single terraform apply

Cons

* The database needs to be publicly accessible to the machine that is running the script – either the infrastructure engineer's local machine or the continuous integration service (e.g. GitHub Actions). First, this causes the database setup process to take a minimum of three steps: (1) create the database cluster with publicly accessible configuration, (2) provision the database users, (3) make the database cluster private. Second, even if it is an acceptable risk to make the database publicly accessible when it is first created and before it has any data, it may not be an acceptable risk to do so once the system is in production. Therefore, after the system is in production, there would no longer be a way to reconfigure the database users or otherwise maintain the system using this approach.
* Need to modify the database cluster configuration after creating it in order to make it private. Modifications requires an additional step, and may also require manual changes to the terraform configuration.

### Shell scripts

Pros

* Simple
* Can represent user configuration as a `.sql` script which could simplify database management by keeping it all within SQL

Cons

* Same as the cons for Terraform – the database needs to be accessible to the machine running the script

### Jump host using EC2

Pros

* Can leverage the Terraform and Shell scripts approaches
* Can access the database securely from within the VPC without making the database cluster publicly accessible

Cons

* Added infrastructure complexity due to the need to maintain an EC2 instance

### Container task using ECS

Pros

* Flexible: can build everything needed in a Docker container, including installing necessary binaries and bundling required libraries and code
* Can access the database securely from within the VPC without making the database cluster publicly accessible

Cons

* Increases complexity of terraform module architecture. There needs to be an ECR repository to store the Docker images. The ECR repository could be in a separate root module, which adds another layer to the module architecture. The ECR repository could be put in the `build-repository` root module, which would would clutter the `build-repository` since it's not related to application builds. Or it could be put in the `database` root module and be manually created using terraform's `-target` flag, but that adds complexity to the setup process.
* Increases number of steps needed to set up the database by at least two, one to create the ECR repository and one to build and publish the Docker image to the ECR repository, before creating the database cluster resources.

### Serverless function using Lambda

Pros

* Flexible: can build many things in a Lambda function
* Can access the database securely from within the VPC without making the database cluster publicly accessible
* Relatively simple

Cons

* Adds a new dependency to the application setup process. The setup process will now rely on the programming language used by the Lambda function (Python in this case).
* Can't easily use custom external binaries in AWS Lambda. So will rely mostly on code rather than lower level scripts like psql.
