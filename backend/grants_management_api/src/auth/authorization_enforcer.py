import logging
import uuid
from collections import defaultdict
from typing import Any

from grants_shared.adapters import db
from grants_shared.api.route_utils import raise_flask_error
from sqlalchemy import select

from src.constants.lookup_constants import MgmtPrivilege, MgmtResourceType
from src.db.models.resource_models import MgmtRole, MgmtResource, MgmtInternalResource, AbstractResourceTableMixin, \
    Department, Subagency, Team, MgmtResourceUserRole, MgmtResourceUser
from src.db.models.user_models import MgmtUser

logger = logging.getLogger(__name__)

class AuthorizationEnforcer:

    def __init__(self, db_session: db.Session):
        self.db_session = db_session
        self.log_context: dict[str, Any] = {}


    def can_access(self, user: MgmtUser, required_privileges: MgmtPrivilege | set[MgmtPrivilege], resource: AbstractResourceTableMixin) -> bool:
        """TODO"""
        # In the event there are any unexpected, we want to get as much context as possible for what errored
        # so attach the log context we've been building up to the error message and re-raise
        try:
            return self._can_access(user=user, required_privileges=required_privileges, resource=resource)
        except Exception:
            logger.exception("Failed to run authZ checks", extra=self.log_context)
            raise

    def _can_access(self, user: MgmtUser, required_privileges: MgmtPrivilege | set[MgmtPrivilege], resource: AbstractResourceTableMixin) -> bool:
        """TODO"""
        if isinstance(required_privileges, MgmtPrivilege):
            required_privileges = {required_privileges}

        self.log_context |= {
            "user_id": user.mgmt_user_id,
            "resource_type": resource.get_resource_type(),
            "required_privileges": "|".join(required_privileges)
        }

        roles = self.get_user_roles_for_resource(user=user, resource=resource)
        # Flip the roles around into a privilege -> role map
        # This way we both have a convenient set of all privileges a user
        # has for the resource, but also can easily see which roles granted them
        # those privileges.
        privilege_to_role: dict[MgmtPrivilege, list[MgmtRole]] = defaultdict(list)
        for role in roles:
            for privilege in role.privileges:
                privilege_to_role[privilege].append(role)

        # Check whether a user has every required privilege in the relevant roles
        # If they have all of them, then they can the resource for that privilege.
        missing_privileges = required_privileges - privilege_to_role.keys()
        if missing_privileges:
            access_granted = False
        else:
            access_granted = True
            # TODO - add the roles that granted them access here
            for privilege in required_privileges:
                pass


        self.log_context |= {"access_granted": access_granted}
        logger.info("Completed authZ check for user", extra=self.log_context)

        return access_granted


    def verify_access(self, user: MgmtUser, required_privileges: MgmtPrivilege | set[MgmtPrivilege], resource) -> None:
        if not self.can_access(user=user, required_privileges=required_privileges, resource=resource):
            raise_flask_error(403, "Forbidden")


    def get_user_roles_for_resource(self, user: MgmtUser, resource: AbstractResourceTableMixin) -> list[MgmtRole]:
        """TODO"""

        # Fetch the resources
        resources = self._get_relevant_resources(resource)

        resource_ids = []

        relevant_resource_map: dict[MgmtResourceType, list[str]] = defaultdict(list)
        for resource in resources:
            resource_ids.append(resource.get_resource_id())
            relevant_resource_map[resource.get_resource_type()].append(str(resource.get_resource_id()))

        # Add every resource ID we fetched to the log context
        # This'll end up like
        # {"relevant_subagency_ids": "uuid0", "relevant_team_ids": "uuid1|uuid2|uuid3"}
        for k, v in relevant_resource_map.items():
            self.log_context[f"relevant_{k}_ids"] = "|".join(v)

        stmt = select(MgmtResourceUser).where(MgmtResourceUser.mgmt_resource_id.in_(resource_ids), MgmtResourceUser.mgmt_user_id == user.mgmt_user_id)

        resource_users = self.db_session.execute(stmt).scalars()

        roles = []
        for resource_user in resource_users:
            roles.extend(resource_user.roles)

        self.log_context["relevant_role_count"] = len(roles)
        return roles



    def _get_relevant_resources(self, resource: AbstractResourceTableMixin) -> list[AbstractResourceTableMixin]:
        """
        Get all relevant resources for checking whether a user can access the provided resource.

        This factors in any inheritance that a particular type may need to consider.

        For each resource type, the following resources are relevant:
        * Department -> Just the department itself
        * Subagency -> The subagency itself and its parent department
        * Team -> The team itself, its parent subagency, and the subagencies parent department

        * Internal resource -> The internal resource itself - no inheritance exists for this type
        """

        # TODO - probably some sort of way to preload the resource hierarchy for efficiency here?

        if isinstance(resource, Department):
            return self._get_resources_for_department(resource)

        if isinstance(resource, Subagency):
            return self._get_resources_for_subagency(resource)

        if isinstance(resource, Team):
            return self._get_resources_for_team(resource)

        if isinstance(resource, MgmtInternalResource):
            return self._get_resources_for_internal_resource(resource)

        error_message = f"No configuration found for determining relevant resources for type {resource.__class__.__name__}"
        raise NotImplementedError(error_message)

    def _get_resources_for_department(self, department: Department) -> list[AbstractResourceTableMixin]:
        """
        Get all relevant resources for a department - which is just the department itself
        """
        return [department]

    def _get_resources_for_subagency(self, subagency: Subagency) -> list[AbstractResourceTableMixin]:
        """
        Get all relevant resources for a subagency - which is the subagency itself + its parent department
        """
        return [subagency] + self._get_resources_for_department(subagency.department)

    def _get_resources_for_team(self, team: Team) -> list[AbstractResourceTableMixin]:
        """
        Get all relevant resources for a team - which is the team itself, the parent subagency, and the subagencies parent department
        """
        return [team] + self._get_resources_for_subagency(team.subagency)

    def _get_resources_for_internal_resource(self, internal_resource: MgmtInternalResource) -> list[AbstractResourceTableMixin]:
        """
        Get all relevant resources for an internal resource - which is just the internal resource itself
        """
        return [internal_resource]