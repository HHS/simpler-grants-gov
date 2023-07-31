# Communications Tooling: Video Conferencing

- **Status:** Accepted
- **Last Modified:** 2023-07-24 <!-- REQUIRED -->
- **Related Issue:** [#99](https://github.com/HHS/grants-equity/issues/99) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Billy Daly, Sarah Knopp, Sumi Thaiveettil
- **Tags:** communucations, open source, video conferencing

## Context and Problem Statement  

The project aims to implement a reliable video conference platform to facilitate seamless communication for both internal collaborations involving HHS and contractors, as well as external engagements with members of the public. The primary objective of this ADR is to evaluate and ultimately choose a suitable video conference tool that aligns with the project's requirements. The selected platform should enable efficient virtual meetings, ensuring clear and effective communication among project stakeholders, and accommodating diverse use cases, from internal team discussions to public outreach and engagement.

## Decision Drivers <!-- RECOMMENDED -->

#### Must Have

- **Public Access**: If they have the right link, members of the public can join a video call without creating an account
Waiting Room: Meeting organizers can configure their meetings to require that attendees must be admitted before they can join the call  
- **Video Recording**: Meeting organizers can record a video call from within the platform  
- **Screen Sharing**: Attendees can share their screen (if given the appropriate permissions by meeting organizer)  
- **Chat**: Users can post comments and questions in a chat that are visible to other attendees  
- **Phone Support**: Users can join by phone if they don't have access to a computer for video  
- **Live Transcription**: The platform supports live transcription for attendees that may need closed captioning  
- **Authority to Operate**: The platform should be covered under the existing ATO for Grants.gov 

#### Nice to Have

- **Webinar**: The platform supports a webinar format, i.e. attendees who can join and post questions but not see one another or unmute without permission  
- **Breakout Rooms**: A meeting organizer can split users out into virtual "breakout rooms" for small-group discussions  
- **Open Source**: The code to run this platform is open source and offers a self-hosting option  
- **Attendance Tracking**: The platform allows host to access attendees to make follow up and attendance tracking easier
- **Community & Support**: The platform has a strong community for ongoing support, updates, and bug fixes
- **Scalability**: The platform should be able to hadndle a growing number of participants and meetings wihtout performance issues


## Options Considered

- [Zoom](https://zoom.us/) - *decision* because of  
- [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams/group-chat-software) - *decision* because of  
- [Google Meet](https://meet.google.com/) - *decision* because of  
- [Jitsu](https://meet.jit.si/) - *decision* because of  

## Decision Outcome <!-- REQUIRED -->

TBD 

### Positive Consequences <!-- OPTIONAL -->

- **Improved Communication**: Video conferencing enables real-tme face-to-face communication, fostering better understanding, transparency, and collaboration among team members, stakeholders, and the general public.
- **Enhanced Collaboration**: With screen sharing and chat features, participants can work together on documents, brainstorm ideas, and address issues efficiently, enhancing overall teamwork.
- **Extended Reach**: The tool allows you to connect with participants from different locations, making it easier to work with remote teams, partners, and the public.
- **Flexibility and Convenience**: Participants can join meetings from their preferred location, whether it's their office, home, or while on the go, promoting flexibility and convenience.
- **Accessibility**: Video conferencing tools often offer closed captioning and accessibility features, making meetings more inclusive for individuals with impairments.

### Negative Consequences <!-- OPTIONAL -->

- **Technical Challenges**: Technical issues, such as poor internet connectivity, audio/video glitches, and compatibility problems, can disrupt meetings and lead to frustration.
- **Security Concerns**: Video conferencing tools may pose security risks, like unauthorized access, data breaches, or potential privacy violations if not properly configured and managed.
- **Fatigue and Burnout**: Frequent video meetings can lead to "Zoom fatigue" or virtual meeting burnout, affecting participant engagement and focus.
- **Distractions and Multitasking**: Participants may be prone to distractions or multitasking during virtual meetings, reducing attention and active engagement.
- **Learning Curve**: New users may find it challenging to navigate and fully utilize the features of the video conference tool, leading to a learning curve for some team members.
- **Bandwidth Consumption**: Video conferencing consumes significant internet bandwidth, which may impact other online activities if the network is not robust enough. This could also be limiting for individuals with low or slow broadband connection.

### Back-up Options



## Comparison Matrix

- ✅ Feature available, meets requirement
- ❌ Feature not available, does not meet requirement
- 🔄 Partial feature, limited feature availability, feature in progress or undergoing improvements
- 1-3 Strength level
- ❓Unknown

| Factor                      | Zoom | Microsoft Teams | Google Meet | Jitsu |
| --------------------------- | :--------: | :--------: | :---------: | :-----: | 
| Public Access                   |     ✅      |   ✅    |      ✅      |    ✅    |  
| Waiting Room               |    ✅     |  ✅   |     ✅      |   ✅    |   
| Video Recording              |    ✅     |   ✅   |     ✅      |   ✅    |  
| Screen Sharing             |     ✅     |  ✅   |     ✅      |   ✅    |  
| Chat                |     ✅     |   ✅   |     ✅      |   ✅    |  
| Phone Support                        |    ✅     |  ✅   |     ✅      |   ✅    |   
| Live Transcription               |     ✅     |   ✅   |     ✅      |    ❌   |   
| Authority to Operate  |     x      |   ✅    |      ?      |    ?    |  
| Webinar* |     ✅      |   ✅    |      3      |    🔄    |  
| Breakout Rooms*        |     ✅     |   ✅   |     ✅      |   🔄    |  
| Open Source*      |    ❌     |   ❌   |     ❌     |   ✅   |  
| Attendance Tracking*                 |    ✅     |  ✅   |     🔄      |   ❓    |  
| Community & Support*         |    3     |   3   |     3      |   3   |  
| Scalability*                 |     ✅     |   ✅   |     ✅      |   ✅    |  


* Nice to have

## Pros and cons of each option <!-- OPTIONAL -->

### Zoom

Zoom is a widely used video conferencing platform known for its ease of use and comprehensive features. It offers virtual meetings, webinars, breakout rooms, screen sharing, chat functionality, and phone support. 

#### Additional details and pricing

- **Pricing**: 

#### Pros



#### Cons

### Microsoft Teams

Microsoft Teams is a collaboration platform integrated with Microsoft 365. It offers video conferencing, chat, file sharing, and integration with other Microsoft applications. It is ideal for organizations already using Microsoft's ecosystem, fostering seamless collaboration among team members.

#### Additional details and pricing

- **Pricing**: 


#### Pros



#### Cons

### Google Meet

Google Meet is part of Google Workspace (formerly G Suite) and is well-suited for Google users. It provides straightforward video conferencing with high-quality audio and video. While it may lack some advanced features, it offers a user-friendly experience for those already using Google's tools.  

#### Additional details and pricing

- **Pricing**:
- **Live Transcription**: Yes but in English only


#### Pros



#### Cons

### Jitsu

Jitsu is an open-source video conferencing solution that stands out for its simplicity and self-hosting capabilities. It supports public access, open meetings, and offers easy setup. 

#### Additional details and pricing

- **Pricing**: 
- **Webinar**: Not a built-in feature (third-party integrations available)
- **Breakout Rooms**: Not a built-in feature (third-party integrations available)
- **Open Source**: Yes
- **Attendance Tracking**: Unknown if this exists. The team could potentially contribute and build this since Jitsu is open source. 

#### Pros



#### Cons





## Links <!-- OPTIONAL -->

