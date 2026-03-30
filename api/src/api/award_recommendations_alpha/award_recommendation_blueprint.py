from apiflask import APIBlueprint

award_recommendation_blueprint = APIBlueprint(
    "award_recommendation_alpha",
    __name__,
    tag="Award Recommendation Alpha",
    url_prefix="/alpha",
)
