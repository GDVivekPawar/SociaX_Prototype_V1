"""Source adapters normalize every connector into the canonical SocialPost shape."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Any


class SourceAdapter(ABC):
    source: str

    @abstractmethod
    async def fetch(self) -> list[dict[str, Any]]:
        """Fetch and normalize source records into SocialPost dictionaries."""


class TelegramAdapter(SourceAdapter):
    source = "telegram"

    def __init__(self, client: Any, channels: list[str]):
        self.client = client
        self.channels = channels

    async def fetch(self) -> list[dict[str, Any]]:
        posts: list[dict[str, Any]] = []
        for channel_name in self.channels:
            entity = await self.client.get_entity(channel_name)
            messages = await self.client.get_messages(entity, limit=25)
            for message in messages:
                if not message.text:
                    continue
                posts.append(self.normalize(message, channel_name, entity))
        return posts

    def normalize(self, message: Any, channel_name: str, entity: Any) -> dict[str, Any]:
        sender = getattr(message, "sender", None)
        username = getattr(sender, "username", None) or getattr(entity, "username", None) or channel_name.lstrip("@")
        first = getattr(sender, "first_name", "") or ""
        last = getattr(sender, "last_name", "") or ""
        author_name = f"{first} {last}".strip() or username
        source_time = message.date.astimezone(timezone.utc).isoformat()
        channel_slug = getattr(entity, "username", None) or channel_name.lstrip("@")
        source_post_id = f"{channel_slug}:{message.id}"
        return {
            "id": f"telegram:{source_post_id}",
            "source": self.source,
            "sourcePostId": source_post_id,
            "authorId": str(getattr(sender, "id", None) or getattr(entity, "id", channel_slug)),
            "authorName": author_name,
            "username": username,
            "content": message.text,
            "sourceTimestamp": source_time,
            "ingestedAt": datetime.now(timezone.utc).isoformat(),
            "url": f"https://t.me/{channel_slug}/{message.id}" if channel_slug else None,
            "language": None,
            "engagement": {"likes": 0, "comments": getattr(message, "replies", None) and (message.replies.replies or 0), "shares": getattr(message, "forwards", 0) or 0, "views": getattr(message, "views", 0) or 0},
            "metadata": {"channel": channel_name},
        }


class DemoAdapter(SourceAdapter):
    """Explicitly non-production data for exercising timelines and multi-source UI."""

    source = "demo"

    async def fetch(self) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) - timedelta(hours=1)
        posts: list[dict[str, Any]] = []
        accounts = ["citypulse_ind", "metro_watch", "citizenvoice", "local_updates", "publicdesk", "groundreport", "urbanobserver", "civicwatch", "cityscope", "dailybrief", "neighbourhoodnote", "commuterdesk"]
        background_neutral = [
            "Commuters are comparing bus wait times near the central junction.", "The weather desk expects scattered showers across the western districts tonight.",
            "Parents are checking the school term calendar and examination dates.", "Supporters are debating the football league table after last night's fixture.",
            "Vendors say the weekend market opened early, with fresh produce arriving before sunrise.", "Ward crews have posted tomorrow's drain-cleaning and streetlight schedule.",
            "The morning train from the east platform is running on its usual timetable.", "Residents are sharing the opening hours for the neighbourhood health camp.",
            "A roadworks notice lists lane closures near the old bus depot this weekend.", "Local teams are preparing for the inter-ward tournament on Saturday.",
            "The library has extended its reading-room hours during the exam period.", "Market traders expect the usual crowd ahead of the festival weekend.",
            "A new timetable has been posted at the community centre entrance.", "Traffic wardens are directing vehicles around the school gate at pickup time.",
            "The evening bulletin includes updates from several neighbourhood associations.", "Residents are comparing prices at the two weekly produce markets.",
            "The civic office has shared its public-counter hours for the coming week.", "A maintenance notice lists routine work on the western footpath.",
        ]
        background_positive = [
            "The extra buses made the morning commute much easier today.", "Good update from the weather desk: the evening match should stay dry.",
            "Thanks to the school office for sharing the exam dates early.", "Great match last night; the home side played with real energy.",
            "The market opened smoothly and the fresh produce looked excellent.", "Streetlights on our block are working again; thanks to the ward crew.",
            "The train arrived on time and the platform felt much calmer.", "The health camp team gave residents clear and helpful guidance.",
            "Road crews finished the crossing early and traffic is moving better.", "Good turnout for the inter-ward tournament; the atmosphere was joyful.",
            "The library's extended hours are a welcome help during exams.", "Vendors say the early opening brought a cheerful crowd to the market.",
        ]
        background_negative = [
            "Commuters are frustrated by another long queue at the central junction.", "People are concerned about the strong-wind warning for tonight.",
            "Parents are angry that the school timetable changed without notice.", "Supporters are furious about the referee's late decision last night.",
            "Vendors say the market access road is blocked and deliveries are delayed.", "Residents are demanding action on the broken streetlights near the crossing.",
            "Passengers are frustrated after the eastbound train was delayed again.", "Families are worried that the health camp ran out of basic supplies.",
            "The road closure has made the school pickup queue worse this afternoon.", "Players and fans are upset that the local ground remains unusable.",
            "Students are concerned about the late change to the examination timetable.", "Traders say the loading-area delay is hurting the morning market.",
            "Students feel sad and disappointed that the community event was canceled.", "Many commuters were shocked by the unexpected lane closure this morning.",
        ]
        secondary_neutral = [
            "Metro commuters are comparing platform queues during the evening peak.", "Residents are tracking the forecast for strong winds across the north side.",
            "Students are asking when the revised examination timetable will be posted.", "Fans are sharing reactions to the local football league result.",
            "Cyclists are discussing the new route markings beside the canal path.", "Families are checking the public clinic's weekend opening hours.",
            "Traders are comparing delivery windows for the central market.", "Residents are following the council meeting agenda for next week.",
            "The neighbourhood group has shared details of Saturday's clean-up.", "Commuters are comparing the two available routes to the station.",
            "Students are discussing the inter-school debate schedule.", "Residents are asking which streets are included in the resurfacing plan.",
        ]
        secondary_positive = [
            "The extra metro staff made the evening platform much easier to navigate.", "The updated wind forecast is reassuring for tonight's outdoor event.",
            "Thanks to the exam office for posting the timetable with time to prepare.", "The local side earned a great result and played with confidence.",
            "The new canal markings make the cycle route much clearer.", "Good news: the weekend clinic added another appointment slot.",
            "Market deliveries arrived early and the morning trade is going well.", "The council agenda answers several questions raised by residents.",
        ]
        secondary_negative = [
            "Commuters are angry that the metro queue reached the street again.", "Families are worried the wind alert could disrupt tonight's plans.",
            "Students are frustrated by another late change to examination dates.", "Fans are upset about the poor officiating in the local match.",
            "Cyclists say the canal route remains dangerous after the repair delay.", "Residents are concerned the clinic has too few weekend appointments.",
            "Traders say late deliveries have made the morning market difficult.", "People are demanding answers after the council postponed the meeting.",
            "Families were saddened when the weekend clinic canceled its outreach visit.", "Residents were surprised to find the footbridge closed without a notice.",
        ]
        context_details = [
            "Eastgate.", "Route6.", "Ward4.", "BlockC.", "Eaststation.", "Canalside.",
            "Marketsquare.", "Northgate.", "Schoollane.", "Lakeview.", "Civicplaza.", "Westend.", "Olddepot.",
            "Riverpark.", "Southgate.", "Hillview.", "Depotroad.", "Gardenview.", "Harbourpoint.",
            "Brookfield.", "Pinecrest.", "Maplewood.", "Stonebridge.",
        ]
        water = [
            "Residents report a water supply disruption and low pressure in the eastern zone.", "Families say the water supply disruption has left taps dry since morning.",
            "Housing groups describe a serious disruption to the water supply and request tankers.", "Residents are frustrated by the water supply disruption and want restoration timing.",
            "People are concerned about the water supply disruption affecting more blocks.", "Families are worried about the water supply disruption and ask when service will return.",
            "Residents are demanding answers about today's water supply disruption.", "People say the water supply disruption is worsening across several streets.",
            "The local committee is checking reports about the water supply disruption.", "Families are storing water during the ongoing water supply disruption.",
            "Residents hope the water supply disruption ends soon; crews are expected to share an update.", "Update on the water supply disruption: service has returned to several homes.",
            "Residents are relieved after water supply disruption support reached the block.", "The response team says service may resume after the water supply disruption repair check.",
            "A restoration notice for the water supply disruption is circulating, though some homes are waiting.", "People are asking whether the water supply disruption update applies to their street.",
        ]
        water_details = [
            "A second street has sent an update to the residents' group.", "The local committee is checking reports from nearby blocks.",
            "People are comparing the timing with yesterday's supply.", "A separate housing lane is asking for a tanker schedule.",
            "Residents are waiting for a ward-level restoration notice.", "The latest report came from a different eastern locality.",
            "Families are sharing the update with neighbouring societies.",
        ]
        def add(kind: str, index: int, timestamp: datetime, content: str, account: str | None = None) -> None:
            username = account or accounts[index % len(accounts)]
            posts.append({"id": f"demo:{kind}:{index}", "source": self.source, "sourcePostId": f"{kind}:{index}", "authorId": f"sim-{username}", "authorName": username.replace("_", " ").title(), "username": f"@{username}", "content": content, "sourceTimestamp": timestamp.isoformat(), "ingestedAt": datetime.now(timezone.utc).isoformat(), "url": None, "language": "en", "engagement": {"likes": index % 41, "comments": index % 11, "shares": index % 7, "views": 30 + index * 3}, "metadata": {"simulation": True, "stream": "scenario"}})
        # Continuous 36-hour background stream (1,080 posts).
        for hour in range(36):
            for position in range(30):
                i = hour * 30 + position
                topic_post = position // 6
                account = accounts[(hour * 5 + topic_post) % len(accounts)]
                mood = i % 10
                if mood < 5:
                    content = background_neutral[(i // 10 + topic_post * 3) % len(background_neutral)]
                elif mood < 8:
                    content = background_negative[(i // 10 + topic_post * 2) % len(background_negative)]
                else:
                    content = background_positive[(i // 10 + topic_post) % len(background_positive)]
                add("background", i, now - timedelta(hours=35 - hour, minutes=position * 2), f"{content} {context_details[i % len(context_details)]}", account)
        # Competing, smaller narratives (200 posts).
        for i in range(200):
            hours_ago = 1 + ((i // 7) % 30)
            mood = i % 10
            if mood < 5:
                content = secondary_neutral[(i // 10 + i % 3) % len(secondary_neutral)]
            elif mood < 8:
                content = secondary_negative[(i // 10 + i % 3) % len(secondary_negative)]
            else:
                content = secondary_positive[(i // 10 + i % 3) % len(secondary_positive)]
            add("secondary", i, now - timedelta(hours=hours_ago, minutes=(i % 7) * 8), f"{content} {context_details[i % len(context_details)]}")
        # Water narrative: sparse history, then 5 -> 15 -> 35 posts/hour.
        for i in range(110):
            content = f"{water[i % len(water)]} {water_details[(i // len(water)) % len(water_details)]}"
            add("water-history", i, now - timedelta(hours=35 - (i % 28), minutes=(i * 17) % 58), content)
        for i, count in enumerate((5, 15, 35)):
            for j in range(count):
                account = ["citypulse_ind", "metro_watch", "citizenvoice", "local_updates", "publicdesk", "groundreport"][j % 6]
                phrase_index = (j + i * 3) % len(water)
                detail_index = (j + i * 2) % len(water_details)
                phase_area = ("Eastzone", "Northzone", "Riverside")[i]
                phrase = f"{water[phrase_index]} {water_details[detail_index]} {phase_area}."
                minute = j if j < 6 else (j * 7) % 55
                add("water-rising", i * 100 + j, now - timedelta(hours=2 - i) + timedelta(minutes=minute), phrase, account)
        return posts
