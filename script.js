(() => {
  "use strict";

  const body = document.body;
  const header = document.getElementById("site-header");
  const menuButton = document.getElementById("menu-button");
  const navigation = document.getElementById("site-nav");
  const storyButton = document.getElementById("story-toggle");
  const fullStory = document.getElementById("full-story");
  const currentYear = document.getElementById("current-year");
  const weeklySchedule = document.getElementById("weekly-schedule");
  const ongoingSeasons = document.getElementById("ongoing-seasons");
  const upcomingSeasons = document.getElementById("upcoming-seasons");
  const upcomingSeasonsEmpty = document.getElementById("upcoming-seasons-empty");
  const currentLeaguesSection = document.getElementById("current-leagues-section");
  const currentLeagueList = document.getElementById("current-league-list");
  const upcomingLeaguesSection = document.getElementById("upcoming-leagues-section");
  const upcomingLeagueList = document.getElementById("upcoming-league-list");
  const currentStandingsSection = document.getElementById("current-standings-section");
  const currentStandingsList = document.getElementById("current-standings-list");

  const calendarIconSvg = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2"></rect>
      <path d="M16 3v4M8 3v4M3 10h18"></path>
    </svg>
  `;

  const standingsIconSvg = `
    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path>
    </svg>
  `;

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function createExternalLink(className, href, label) {
    const link = document.createElement("a");

    link.className = className;
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;

    return link;
  }

  function appendTextElement(parent, tagName, text) {
    const element = document.createElement(tagName);
    element.textContent = text;
    parent.appendChild(element);

    return element;
  }

  function createWeeklyEvent(event) {
    const article = document.createElement("article");
    const copy = document.createElement("div");
    const meta = document.createElement("div");
    const actionLabel =
      event.weeklyRegistrationLabel;

    article.className = "weekly-event";
    meta.className = "weekly-event-meta";

    appendTextElement(copy, "h3", event.title);
    appendTextElement(copy, "p", event.weekly.description);
    appendTextElement(meta, "span", event.time);
    appendTextElement(meta, "span", event.location);

    article.appendChild(copy);
    article.appendChild(meta);

    if (event.registrationUrl && actionLabel) {
      article.appendChild(
        createExternalLink(
          "button button-outline weekly-event-action",
          event.registrationUrl,
          actionLabel
        )
      );
    } else {
      const emptyAction = document.createElement("span");
      emptyAction.className = "weekly-event-action";
      emptyAction.setAttribute("aria-hidden", "true");
      article.appendChild(emptyAction);
    }

    return article;
  }

  function renderWeeklySchedule(events) {
    if (!weeklySchedule) {
      return;
    }

    const dayGroups = [];

    events
      .filter((event) => event.weekly)
      .forEach((event) => {
        const key = `${event.weekly.day}-${event.weekly.date}`;
        const existingGroup =
          dayGroups.find((group) => group.key === key);

        if (existingGroup) {
          existingGroup.events.push(event);
        } else {
          dayGroups.push({
            key,
            day: event.weekly.day,
            date: event.weekly.date,
            events: [event]
          });
        }
      });

    weeklySchedule.replaceChildren();

    dayGroups.forEach((group) => {
      const section = document.createElement("section");
      const date = document.createElement("div");
      const dayName = document.createElement("strong");
      const dateText = document.createElement("span");
      const eventsContainer = document.createElement("div");
      const headingId = slugify(group.key);

      section.className = "weekly-day";
      section.setAttribute("aria-labelledby", headingId);
      date.className = "weekly-date";
      eventsContainer.className = "weekly-events";
      dayName.id = headingId;
      dayName.textContent = group.day;
      dateText.textContent = group.date;

      date.appendChild(dayName);
      date.appendChild(dateText);

      group.events.forEach((event) => {
        eventsContainer.appendChild(createWeeklyEvent(event));
      });

      section.appendChild(date);
      section.appendChild(eventsContainer);
      weeklySchedule.appendChild(section);
    });
  }

  function createDropInHelper() {
    const helper = document.createElement("p");
    const link = document.createElement("a");

    helper.className = "drop-in-helper";
    helper.append("For drop-in availability, ");
    link.href = "mailto:play@wdcpickleball.com";
    link.textContent = "email us";
    helper.appendChild(link);
    helper.append(".");

    return helper;
  }

  function createSeasonCard(event) {
    const article = document.createElement("article");
    const status = document.createElement("span");
    const titleRow = document.createElement("div");
    const icon = document.createElement("span");
    const details = document.createElement("dl");
    const action = document.createElement("div");
    const when = `${event.days}, ${event.time}`;

    article.className = "season-card";
    status.className = "season-status";
    titleRow.className = "season-title-row";
    icon.className = "season-icon";
    details.className = "season-details";
    action.className = "season-action";

    status.textContent = event.statusLabel;
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = calendarIconSvg;

    titleRow.appendChild(icon);
    appendTextElement(titleRow, "h4", event.title);

    [
      ["When", when],
      ["Location", event.location]
    ].forEach(([term, description]) => {
      const row = document.createElement("div");
      appendTextElement(row, "dt", term);
      appendTextElement(row, "dd", description);
      details.appendChild(row);
    });

    if (
      event.registrationUrl &&
      event.seasonRegistrationLabel &&
      event.seasonRegistrationLabel !== "Registration Closed"
    ) {
      action.appendChild(
        createExternalLink(
          "button button-outline",
          event.registrationUrl,
          event.seasonRegistrationLabel
        )
      );
    } else if (event.seasonRegistrationLabel) {
      const closed = document.createElement("span");
      closed.className = "registration-closed";
      closed.textContent = event.seasonRegistrationLabel;
      action.appendChild(closed);
    }

    if (event.type === "league") {
      action.appendChild(createDropInHelper());
    }

    article.appendChild(status);
    article.appendChild(titleRow);
    article.appendChild(details);
    article.appendChild(action);

    return article;
  }

  function renderScheduleSeasons(events) {
    if (!ongoingSeasons && !upcomingSeasons) {
      return;
    }

    const ongoingEvents =
      events.filter((event) => (
        event.type === "league" &&
        event.status === "ongoing"
      ));

    const upcomingEvents =
      events.filter((event) => (
        event.type === "league" &&
        event.status === "upcoming"
      ));

    if (ongoingSeasons) {
      ongoingSeasons.replaceChildren();

      ongoingEvents.forEach((event) => {
        ongoingSeasons.appendChild(createSeasonCard(event));
      });
    }

    if (upcomingSeasons) {
      upcomingSeasons.replaceChildren();

      upcomingEvents.forEach((event) => {
        upcomingSeasons.appendChild(createSeasonCard(event));
      });
    }

    if (upcomingSeasonsEmpty) {
      upcomingSeasonsEmpty.hidden = upcomingEvents.length > 0;
    }
  }

  function createLeagueRow(event) {
    const article = document.createElement("article");
    const icon = document.createElement("span");
    const scheduleText =
      `${event.dateRange} · ${event.days}, ${event.time}`;

    article.className = "league-row";
    icon.className = "league-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = calendarIconSvg.replace(
      'stroke-width="1.8"',
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    );

    article.appendChild(icon);
    appendTextElement(article, "h3", event.title);
    appendTextElement(article, "p", scheduleText);
    appendTextElement(article, "p", event.location);

    if (event.registrationUrl && event.registrationLabel) {
      article.appendChild(
        createExternalLink(
          "button button-outline",
          event.registrationUrl,
          event.registrationLabel
        )
      );
    }

    return article;
  }

  function renderLeagueSection(events, status, section, list) {
    if (!section || !list) {
      return;
    }

    const leagueEvents =
      events.filter((event) => (
        event.type === "league" &&
        event.status === status
      ));

    list.replaceChildren();

    leagueEvents.forEach((event) => {
      list.appendChild(createLeagueRow(event));
    });

    section.hidden = leagueEvents.length === 0;
  }

  function renderLadderLeagues(events) {
    renderLeagueSection(
      events,
      "ongoing",
      currentLeaguesSection,
      currentLeagueList
    );
    renderLeagueSection(
      events,
      "upcoming",
      upcomingLeaguesSection,
      upcomingLeagueList
    );
  }

  function createStandingsLink(event) {
    const link = document.createElement("a");
    const icon = document.createElement("span");
    const arrow = document.createElement("span");

    link.href = event.standingsUrl;
    icon.className = "standings-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = standingsIconSvg;
    arrow.className = "standings-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";

    link.appendChild(icon);
    link.append(event.standingsLabel);
    link.appendChild(arrow);

    return link;
  }

  function renderCurrentStandings(events) {
    if (!currentStandingsList) {
      return;
    }

    const standingsEvents =
      events.filter((event) => (
        event.type === "league" &&
        event.status === "ongoing" &&
        event.standingsLabel &&
        event.standingsUrl
      ));

    currentStandingsList.replaceChildren();

    standingsEvents.forEach((event) => {
      currentStandingsList.appendChild(createStandingsLink(event));
    });

    if (currentStandingsSection) {
      currentStandingsSection.hidden = standingsEvents.length === 0;
    }
  }

  async function loadScheduleEvents() {
    if (
      !weeklySchedule &&
      !ongoingSeasons &&
      !upcomingSeasons &&
      !currentLeagueList &&
      !upcomingLeagueList &&
      !currentStandingsList
    ) {
      return;
    }

    try {
      const response = await fetch("events.json");

      if (!response.ok) {
        throw new Error("Could not load events.json");
      }

      const events = await response.json();

      renderWeeklySchedule(events);
      renderScheduleSeasons(events);
      renderLadderLeagues(events);
      renderCurrentStandings(events);
    } catch (error) {
      console.error("Error loading events.json:", error);
    }
  }

  function updateHeader() {
    if (!header) {
      return;
    }

    header.classList.toggle(
      "scrolled",
      window.scrollY > 20
    );
  }

  function openMenu() {
    if (!menuButton || !navigation) {
      return;
    }

    menuButton.classList.add("active");
    navigation.classList.add("is-open");
    body.classList.add("menu-open");

    menuButton.setAttribute(
      "aria-expanded",
      "true"
    );

    menuButton.setAttribute(
      "aria-label",
      "Close navigation"
    );
  }

  function closeMenu() {
    if (!menuButton || !navigation) {
      return;
    }

    menuButton.classList.remove("active");
    navigation.classList.remove("is-open");
    body.classList.remove("menu-open");

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

    menuButton.setAttribute(
      "aria-label",
      "Open navigation"
    );
  }

  function toggleMenu() {
    if (!navigation) {
      return;
    }

    const menuIsOpen =
      navigation.classList.contains("is-open");

    if (menuIsOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  updateHeader();

  window.addEventListener(
    "scroll",
    updateHeader,
    {
      passive: true
    }
  );

  if (menuButton && navigation) {

    menuButton.addEventListener(
      "click",
      toggleMenu
    );

    navigation
      .querySelectorAll("a")
      .forEach((link) => {

        link.addEventListener(
          "click",
          closeMenu
        );

      });

  }

  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Escape") {
        closeMenu();
      }

    }
  );

  window.addEventListener(
    "resize",
    () => {

     if (window.innerWidth > 1080) {
        closeMenu();
      }

    }
  );

  if (storyButton && fullStory) {

    storyButton.addEventListener(
      "click",
      () => {

        const storyIsHidden =
          fullStory.hasAttribute("hidden");

        if (storyIsHidden) {

          fullStory.removeAttribute("hidden");

          storyButton.setAttribute(
            "aria-expanded",
            "true"
          );

          storyButton.innerHTML = `
            Close the full story
            <span aria-hidden="true">↑</span>
          `;

        } else {

          fullStory.setAttribute(
            "hidden",
            ""
          );

          storyButton.setAttribute(
            "aria-expanded",
            "false"
          );

          storyButton.innerHTML = `
            Read the full story
            <span aria-hidden="true">→</span>
          `;

        }

      }
    );

  }

  const revealElements =
    document.querySelectorAll(".reveal");

  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (
    reducedMotion ||
    !("IntersectionObserver" in window)
  ) {

    revealElements.forEach(
      (element) => {
        element.classList.add("visible");
      }
    );

  } else {

    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {

          entries.forEach(
            (entry) => {

              if (entry.isIntersecting) {

                entry.target.classList.add(
                  "visible"
                );

                observer.unobserve(
                  entry.target
                );

              }

            }
          );

        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -40px 0px"
        }
      );

    revealElements.forEach(
      (element) => {
        revealObserver.observe(element);
      }
    );

  }

  const counters =
    document.querySelectorAll(".counter");

  function animateCounter(element) {

    const target =
      Number(element.dataset.target || 0);

    const suffix =
      element.dataset.suffix || "";

    const duration = 1300;
    const startTime = performance.now();

    function updateCounter(currentTime) {

      const elapsed =
        currentTime - startTime;

      const progress =
        Math.min(elapsed / duration, 1);

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      const currentValue =
        Math.round(target * easedProgress);

      element.textContent =
        currentValue.toLocaleString() + suffix;

      if (progress < 1) {
        window.requestAnimationFrame(
          updateCounter
        );
      }

    }

    window.requestAnimationFrame(
      updateCounter
    );
  }

  if (
    counters.length > 0 &&
    "IntersectionObserver" in window
  ) {

    const counterObserver =
      new IntersectionObserver(
        (entries, observer) => {

          entries.forEach(
            (entry) => {

              if (entry.isIntersecting) {

                animateCounter(entry.target);

                observer.unobserve(
                  entry.target
                );

              }

            }
          );

        },
        {
          threshold: 0.5
        }
      );

    counters.forEach(
      (counter) => {
        counterObserver.observe(counter);
      }
    );

  } else {

    counters.forEach(
      (counter) => {
        animateCounter(counter);
      }
    );

  }

  if (currentYear) {

    currentYear.textContent =
      new Date().getFullYear();

  }

  loadScheduleEvents();

})();
