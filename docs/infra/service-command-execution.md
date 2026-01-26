# Running commands on the service

The infrastructure supports developer access to a running application's service container using [ECS Exec](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html). You can run commands in or get a shell to an actively running container, allowing you to quickly debug issues or to use the container to access an attached database. Once you create an interactive shell, you will be operating with the same permissions as the container (e.g. you may access any database the container has access to, but you cannot access databases within the same account that the container does not have access to).

⚠️ **Warning: It is not recommended to enable service access in a production environment!**

## Prerequisites

* You'll need to have [set up infrastructure tools](/docs/infra/set-up-infrastructure-tools.md), like Terraform, AWS CLI, and AWS authentication
* You'll need to have set up the [app environments](/docs/infra/set-up-app-env.md)
* You'll need to have [installed the Session Manager plugin for the AWS CLI](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)

## Instructions

### 1. Make sure you're authenticated into the AWS account that the ECS container is running in

This takes effect in whatever account you're authenticated into. To see which account that is, run

```bash
aws sts get-caller-identity
```

To see a more human readable account alias instead of the account, run

```bash
aws iam list-account-aliases
```

### 2. Enable service execution access

Within the `app-config` directory (e.g. `infra/<APP_NAME>/app-config`), each environment has its own config file named after the environment. For example, if the application has three environments `dev`, `staging`, and `prod`, it should have corresponding `dev.tf`, `staging.tf`, and `prod.tf` files.

In the environment config file for the environment that you want to enable service access, set `enable_command_execution` to `true`.

### 3. Update the network

To enable service execution access, the VPC requires an additional VPC endpoint. Update the network by running

```bash
make infra-update-network NETWORK_NAME=<NETWORK_NAME>
```

`NETWORK_NAME` needs to be the name of the network that the application environment is running in.

### 4. Update the application service

To enable service execution access, some configuration changes need to be applied to the ECS Task Definition. Update the service by running

```bash
make infra-update-app-service APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>
```

`APP_NAME` needs to be the name of the application folder within the `infra` folder.

`ENVIRONMENT` needs to be the name of the environment to update.

### 5. Execute commands

To create an interactive shell, run

```bash
aws ecs execute-command --cluster <CLUSTER_NAME> \
    --task <TASK_ID> \
    --container <CONTAINER_NAME> \
    --interactive \
    --command "/bin/sh"
```

To run other commands, modify the `--command` flag to execute the command, rather than starting a shell.

## Troubleshooting

If you get an error after running the above steps, these diagnosis steps may be helpful:
1. Verify that `enableExecuteCommand` is `true` on your running task by using `aws ecs describe-tasks --cluster $APP_NAME-$ENVIRONMENT_NAME --task <TASK_ID>`. If not, run the `infra-update-app-service` command above and/or redeploy your service.
2. Make sure that the SSM Agent is running by checking the `managedAgents` object in the `containers` array of the `aws ecs describe-tasks` command output. If it is `STOPPED`, you may have an issue with your container that is preventing the agent from running.
3. Run the [amazon-ecs-exec-checker](https://github.com/aws-containers/amazon-ecs-exec-checker) script to further pinpoint issues that may prevent ECS Exec from functioning.
