import logging
import uuid
from collections import defaultdict
from typing import Any

from grants_shared.adapters import db
from grants_shared.api.route_utils import raise_flask_error
from sqlalchemy import select

from src.constants.lookup_constants import MgmtPrivilege, MgmtResourceType
from src.db.models.resource_models import MgmtRole, MgmtInternalResource, AbstractResourceTableMixin, \
    Department, Subagency, Team, MgmtResourceUser
from src.db.models.user_models import MgmtUser

logger = logging.getLogger(__name__)

class AuthorizationEnforcer:

    def __init__(self, db_session: db.Session):
        self.db_session = db_session
        self.log_context: dict[str, Any] = {}


    def can_access(self, user: MgmtUser, required_privileges: MgmtPrivilege | set[MgmtPrivilege], resource: AbstractResourceTableMixin) -> bool:
        """
        Check whether a user has the required privilege against the resource.

        This check has 3 core pieces:
        * Determine which resources are relevant to the resource passed in. If a resource
          has inheritance, then we'll grab all the resources that a user could be able to access
          the passed in resource through. Exact inheritance is defined per resource.
        * Determine which roles the user has against the resources determine in step 1.
        * Check whether a user has the required privileges within the roles from step 2.
          If multiple required privileges are passed in, the user does not need every
          privilege to come from the same role.

        """
        # In the event there are any unexpected, we want to get as much context as possible for what errored
        # so attach the log context we've been building up to the error message and re-raise
        try:
            return self._can_access(user=user, required_privileges=required_privileges, resource=resource)
        except Exception:
            logger.exception("Failed to run authZ checks", extra=self.log_context)
            raise

    def _can_access(self, user: MgmtUser, required_privileges: MgmtPrivilege | set[MgmtPrivilege], resource: AbstractResourceTableMixin) -> bool:
        """Internal implementation of can_access, call that function directly instead."""
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

            # For logging, grab all role IDs/names that were involved in authorizing
            authorizing_role_ids = set()
            authorizing_role_names = set()
            for privilege in required_privileges:
                authorizing_roles =  privilege_to_role.get(privilege, [])
                for authorizing_role in authorizing_roles:
                    authorizing_role_ids.add(str(authorizing_role.mgmt_role_id))
                    authorizing_role_names.add(authorizing_role.role_name)

            self.log_context["authorizing_role_ids"] = "|".join(authorizing_role_ids)
            self.log_context["authorizing_role_names"] = "|".join(authorizing_role_names)


        self.log_context |= {"access_granted": access_granted}
        logger.info("Completed authZ check for user", extra=self.log_context)

        return access_granted


    def verify_access(self, user: MgmtUser, required_privileges: MgmtPrivilege | set[MgmtPrivilege], resource) -> None:
        """Wrapper function around can_access that handles raising a 403 if the user does not have access."""
        if not self.can_access(user=user, required_privileges=required_privileges, resource=resource):
            raise_flask_error(403, "Forbidden")


    def get_user_roles_for_resource(self, user: MgmtUser, resource: AbstractResourceTableMixin) -> list[MgmtRole]:
        """
        Get all roles of the given user that are relevant to the resource.

        Depending on what resources are relevant to the passed in resource, this may
        be roles against several resources.

        For example, if having a role against a parent resource should allow access
        to the passed in resource, both resources will be relevant, and all user roles against
        both would be returned.
        """

        # Fetch the relevant resources
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

        # Grab all resource user connections where either one of the above resources
        # is present AND the user is the one with that role.
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