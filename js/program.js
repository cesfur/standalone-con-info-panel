/* Con Info Panel | (c) Cesfur z.s. | GNU GPL License v. 3.0 */
var con_info_panel_program = new function () {
    var nowShift = 0; // 5 * 24 * 60 * 60; //DEBUG, set to zero in production
    var refreshDelay = 2000;
    var eventReloadDelay = 10000;
    var eventRefreshDelay = 4000;

    var eventRefreshAge = eventRefreshDelay;
    var eventReloadAge = 0;

    var reloadCounter = 0;
    var eventsRaw = {
        cs: { lastModified: '', events: [] },
        en: { lastModified: '', events: [] }
    };

    var events = [];
    var eventViewIndex = -1;
    var selectedEvent = { eventID: null, slotIndex: -1 };

    var refresh = function () {
        eventReloadAge += refreshDelay;
        if (eventReloadAge >= eventReloadDelay) {
            eventReloadAge = 0;
            reload();
        }

        eventRefreshAge += refreshDelay;
        if (eventRefreshAge >= eventRefreshDelay) {
            eventRefreshAge = 0;

            if (reloadCounter > 0) {
                con_info_panel.clearElementClass(document.getElementsByClassName('content')[0], 'loading');
                buildEvents();
                reloadCounter = 0;
            }

            refreshEvents();
        }
    }

    var reload = function () {
        con_info_panel.requestText('data/events.cs.json', reloadedCS, false);
        con_info_panel.requestText('data/events.en.json', reloadedEN, false);
    }

    var reloaded = function (context, text, lastModified) {
        if (lastModified != context.lastModified) {
            context.events = extractEvents(text);
            context.lastModified = lastModified;
            reloadCounter++;
        }
    }

    var reloadedCS = function (text, lastModified) {
        reloaded(eventsRaw.cs, text, lastModified);
    }
    var reloadedEN = function (text, lastModified) {
        reloaded(eventsRaw.en, text, lastModified);
    }

    var extractEvents = function (text) {
        if (text != null && text != '') {
            return JSON.parse(text).events;
        } else {
            return [];
        }
    }

    var buildEvents = function () {
        var newEvents = [];
        for (var i = 0; i < eventsRaw.cs.events.length; i++) {
            var event_cs = eventsRaw.cs.events[i];
            var event_en = null;
            for (var j = 0; (j < eventsRaw.en.events.length) && !event_en; j++) {
                var possibleEvent = eventsRaw.en.events[j];
                if (possibleEvent.code == event_cs.code
                        && possibleEvent.location_id == event_cs.location_id
                        && possibleEvent.start_time_utc == event_cs.start_time_utc) {
                    event_en = possibleEvent;
                }
            }

            if (event_en) {
                newEvents.push({
                    id: event_cs.code + '-' + event_cs.start_time_utc,
                    name: { cs: event_cs.name, en: event_en.name },
                    description: { cs: event_cs.description, en: event_en.description },
                    start: event_cs.start_time_utc,
                    end: event_cs.end_time_utc,
                    day_start_time: event_cs.day_start_time,
                    day_end_time: event_cs.day_end_time,
                    location_id: event_cs.location_id
                })
            }
        }

        var compareEvents = function(a, b) {
            if (a.start < b.start) {
                return -1;
            }
            else if (a.start > b.start) {
                return 1;
            }
            else if (a.end < b.end) {
                return -1;
            }
            else if (a.end > b.end) {
                return 1;
            }
            else {
                return 0;
            }
        }

        newEvents.sort(compareEvents);

        events = newEvents;
        eventViewIndex = -1;
        console.debug('Built ' + events.length + ' events');
    }

    var findEventByTime = function (time, index) {
        while (index < events.length
            && (events[index].end < time
                || events[index].start < time)) {
            index++;
        }
        return index;
    }

    var setSlotClass = function (slot, event, selected) {
        var className = 'event ' + event.location_id;
        if (selected) {
            className += ' selected';
        }
        con_info_panel.setElementClass(slot, className);
    }

    var setEventInfo = function (event) {
        var eventInfoElements = document.getElementById('eventInfo').getElementsByTagName('div');
        con_info_panel.setElementText(eventInfoElements[0].getElementsByTagName('h1')[0], event ? event.name.cs : '');
        con_info_panel.setElementText(eventInfoElements[0].getElementsByTagName('p')[0], event ? event.description.cs : '');
        con_info_panel.setElementText(eventInfoElements[1].getElementsByTagName('h1')[0], event ? event.name.en : '');
        con_info_panel.setElementText(eventInfoElements[1].getElementsByTagName('p')[0], event ? event.description.en : '');
    }

    var refreshEvents = function () {
        var now = Math.floor(Date.now() / 1000) + nowShift;

        // Find range of events
        var eventIndex = Math.max(0, eventViewIndex);
        while (eventIndex < events.length
            && events[eventIndex].end < now) {
            eventIndex++;
        }

        var updatedSelectedEvent = {
            eventID: selectedEvent.eventID,
            slotIndex: selectedEvent.slotIndex
        };

        var slots = document.getElementsByClassName('event');
        if (eventIndex != eventViewIndex) {
            eventViewIndex = eventIndex;
            updatedSelectedEvent.slotIndex = -1;

            // Fill slots
            var slotIndex = 0;
            while ((slotIndex < slots.length) && (eventIndex < events.length)) {
                var slot = slots[slotIndex];
                var event = events[eventIndex];

                con_info_panel.setElementText(slot.getElementsByClassName('time')[0], event.day_start_time);
                var nameElements = slot.getElementsByClassName('name')[0].getElementsByTagName('div');
                con_info_panel.setElementText(nameElements[0], event.name.cs);
                con_info_panel.setElementText(nameElements[1], event.name.en);
                setSlotClass(slot, event, false);

                if (event.id == updatedSelectedEvent.eventID) {
                    updatedSelectedEvent.slotIndex = slotIndex;
                }

                slotIndex++;
                eventIndex++;
            }

            // Clear unused slot
            while (slotIndex < slots.length) {
                con_info_panel.setElementClass(slots[slotIndex], 'event noEvent');
                slotIndex++;
            }

            if (updatedSelectedEvent.slotIndex < 0) {
                updatedSelectedEvent.eventID = null;
            }
        }

        if (!updatedSelectedEvent.eventID) {
            updatedSelectedEvent.slotIndex = -1;
        }

        updatedSelectedEvent.slotIndex++;
        if (updatedSelectedEvent.slotIndex >= slots.length
            || con_info_panel.hasElementClass(slots[updatedSelectedEvent.slotIndex], 'noEvent')) {
            updatedSelectedEvent.slotIndex = 0;
        }

        var eventIndex = eventViewIndex + updatedSelectedEvent.slotIndex;
        if (eventIndex < events.length) {
            updatedSelectedEvent.eventID = events[eventIndex].id;
        } else {
            updatedSelectedEvent.eventID = null;
        }

        if (selectedEvent.slotIndex != updatedSelectedEvent.slotIndex) {
            for (var i = 0; i < slots.length; i++) {
                con_info_panel.clearElementClass(slots[i], 'selected');
            }
        }

        if (updatedSelectedEvent.eventID) {
            con_info_panel.addElementClass(slots[updatedSelectedEvent.slotIndex], 'selected');
            setEventInfo(events[eventIndex]);
        } else {
            setEventInfo(null);
        }
        selectedEvent = updatedSelectedEvent;
    }

    this.start = function () {
        reload();
        setInterval(refresh, refreshDelay);
    }
}

