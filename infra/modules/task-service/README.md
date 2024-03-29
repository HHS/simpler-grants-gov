# modules/task-service

This module is functionally the same module as `modules/service`, but with the load balancer and associated networking components removed.

This module (eg. `modules/task-service`) is meant for use with services that composed of individually run tasks. The modules it was based off of
(eg. `modules/service`) is meant for use with web servers.
