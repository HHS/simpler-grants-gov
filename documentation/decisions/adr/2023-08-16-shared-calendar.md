# ADR - Shared Calendar 

# Context and Problem Statement

We want to explore and evaluate options for a grants.gov shared calendar in order to facilitate cross team meetings. This shared calendar tool will be utilized by both internal individuals at HHS, Agile6 and Nava, requiring the shared calendar platform to be covered under the Grants.gov Authority to Operate (ATO). Users on the HHS network should have access to view this shared calendar. The selected platform should have the ability to create and share calendar events that are only visible to the grants.gov team. Additionally, Users should be able to create and share calendar events that are visible to members of the public. Lastly, Users should have the ability to add the details for a video conference to a calendar invite, and preferably create a new meeting-specific video conference link directly from the event creation page.

# Decision Drivers

Functionality: consider the features and functionalities offered with each platform. Consider whether the shared calendar solution provides essential capabilities like ability to create public and private meeting invites, accessibility to the HHS grants.gov team, video conferencing integration 
Usability: the selected shared calendar solution should be user-friendly and intuitive. It should be easy for team members, including both technical and non-technical individuals, to navigate and utilize effectively.
Accessibility: solution should be accessible for all individuals, including but not limited to individuals with visual, hearing or motor impairments.
Public Access: the selected solution should have the ability to be accessible by public members outside the core grants.gov team
Cost: evaluate the pricing structure, considering growth of users and additional features in the future
Open-source: a solution that offers open-source is more likely to align with HHS values and provide transparency, customizability, community collaboration, longevity and continuity, cost effectiveness, and overall autonomy for our project. 
Options Considered
Google Calendar
Nextcloud Calendar

| Features, capabilities, evaluation criteria                             | Google Calendar             | Nextcloud Calendar | Slack (Outlook and Gmail Integration)           | Calendly            |
| ----------------------------------------------------------------------- | --------------------------- | ------------------ | ----------------------------------------------- | ------------------- |
| Experience with current team                                            | ✅                           | ❌                  | ✅

(Minor onboarding needed for slack commands) | ❌                   |
| Ability to create an event right from Slack using the shortcuts button. | ✅                           | ✅                  | ✅                                               | ✅                   |
| Integration with Outlook and Gmail                                      | ❌                           | ✅                  | ✅                                               | ✅                   |
| Github integration                                                      | ✅                           | ✅                  | ✅                                               | ✅                   |
| Open-source                                                             | ❌                           | ✅                  | ❌                                               | ❌                   |
| 3rd Party Video Integration                                             | ✅                           | ✅                  | ✅                                               | ✅                   |
| Slack integration                                                       | ✅                           | ✅                  | ✅                                               | ❌                   |
| Built in Video Conference Integration                                   | ✅                           | ✅                  | ✅                                               | ✅                   |
| Integrations with Gitbook                                               | ✅                           | ❌                  | ❌                                               | ❌                   |
| Pricing                                                                 | 100 users for $46/user/year | $6/user/year       | Free                                            | $8

 /seat/mo

<br> |


# NextCloud 
Summary points:
Nextcloud offers a modern, easy to use content collaboration platform accessible through mobile, desktop and web interfaces
Nextcloud offers government pricing. 
Real-time collaboration and fast but secure document exchange with other organizations.
Data Protection 
Pricing: Starting at 100 users for $46/user/year
Government: Contacted the NextCloud for government pricing 



# Google Calendar

Summary points:
Google Calendar is designed for teams, so it’s easy to share your schedule with others and create multiple calendars that you and your team can use together
A bit more familiarity with the team members 
Ability to schedule meetings with external team members
Integrated with video conferencing
Pricing: 
Free with a Google account
Business Starter for Google Workspace, which includes all Google apps, starts at $6/user/month.
Must be integrated with google workspace


# Slack (Outlook and Gmail Integration) 
Its Free
Easy onboarding for HHS, Micro Health, Agile6 and Nava
Ability to view team members availability across calendars
Ability to add External video conferencing to the meeting invite
Ability to create meeting invite using slack
Create an event right from Slack using the shortcuts button.
Automatically sync your calendar to your Slack status to let your team know when you are in a meeting, out of the office, or working from home.
See a holistic view of your daily schedule from Slack.
You can get notified when an event is starting soon, and join a Hangout, Zoom, Webex, or Microsoft Teams meeting directly from the calendar reminder in Slack.
Ability to RSVP directly to event invitations, get updated when an event’s details change, and change your response as needed.

# Decision
We’ve decided to move forward with Slack due to its convenience in integrating with Outlook and Google Calendar. The Slack integration also offers a lot of flexibility in viewing team members' calendars whether on Google Calendar or Outlook.

