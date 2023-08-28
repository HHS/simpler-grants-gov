import pandas as pd


def calculate_burndown(
    df_raw: pd.DataFrame,
    sprint: str,
    opened_col: str,
    closed_col: str,
    sprint_start: str,
    sprint_end: str,
) -> pd.DataFrame:
    """"""
    # isolate columns we need to calculate burndown
    date_col = "dates"
    sprint_mask = df_raw["sprint"] == sprint
    df_sprint = df_raw.loc[sprint_mask, [opened_col, closed_col]]
    # get the date range over which tix were created and closed
    sprint_min = df_sprint[opened_col].min()
    sprint_max = df_sprint[closed_col].max()
    df_sprint_dates = pd.DataFrame(
        pd.date_range(sprint_min, sprint_max), columns=[date_col]
    )
    # get the number of tix opened and closed each day
    df_opened = df_sprint.groupby(opened_col, as_index=False).size()
    df_closed = df_sprint.groupby(closed_col, as_index=False).size()
    df_opened.columns = [date_col, "opened_count"]
    df_closed.columns = [date_col, "closed_count"]
    # combine the daily opened and closed counts to get total open per day
    df_burndown = (
        df_sprint_dates.merge(df_opened, on=date_col, how="left")
        .merge(df_closed, on=date_col, how="left")
        .fillna(0)
    )
    df_burndown["delta"] = df_burndown["opened_count"] - df_burndown["closed_count"]
    df_burndown["total_open"] = df_burndown["delta"].cumsum()
    # isolate the dates for this sprint
    date_mask = df_burndown[date_col].between(sprint_start, sprint_end)
    return df_burndown.loc[date_mask, [date_col, "total_open"]]
