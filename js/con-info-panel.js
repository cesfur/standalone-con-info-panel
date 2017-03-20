/* Con Info Panel | (c) Cesfur z.s. | GNU GPL License v. 3.0 */
var con_info_panel = new function () {
    this.createHttpRequest = function() {
        var activexmodes = ["Msxml2.XMLHTTP", "Microsoft.XMLHTTP"]
        if (window.ActiveXObject) { // Test for support for ActiveXObject in IE first (XMLHttpRequest in IE7 is broken)
            for (var i = 0; i < activexmodes.length; i++) {
                try {
                    return new ActiveXObject(activexmodes[i]);
                }
                catch (e) {
                }
            }

            return null;
        }
        else if (window.XMLHttpRequest) { // Mozilla, Safari etc.
            return new XMLHttpRequest();
        }
        else {
            return null;
        }
    }

    this.requestText = function (url, oncomplete, cache) {
        if (url != null && url != '') {
            var request = con_info_panel.createHttpRequest();
            request.onreadystatechange = function () {
                if ((request.readyState == 4) && (request.status == 200)) {
                    oncomplete(request.responseText, request.getResponseHeader('Last-Modified'));
                }
            }
            if (!cache) {
                url += '?v=' + Math.floor(Date.now() / 1000) % 100000;
            }
            request.open("GET", url, true);
            if (!cache) {
                request.setRequestHeader('Pragma', 'no-cache');
                request.setRequestHeader('Cache-Control', 'no-cache');
            }
            request.send(null);
        }
    }

    this.testFile = function (url, oncomplete) {
        if (url != null && url != '') {
            var request = con_info_panel.createHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    var code = 'ERROR';
                    var lastModified = null;
                    switch (request.status) {
                        case 200: code = 'OK'; lastModified = request.getResponseHeader('Last-Modified'); break;
                        case 404: code = 'NOT_FOUND'; break;
                    }
                    oncomplete(url, code, lastModified);
                }
            }
            url += '?v=' + Math.floor(Date.now() / 1000) % 100000;
            request.open("HEAD", url, true);
            request.setRequestHeader('Pragma', 'no-cache');
            request.setRequestHeader('Cache-Control', 'no-cache');
            request.send(null);
        }
    }

    this.setElementAttribute = function (element, attribute, value) {
        if (element != null && element.getAttribute(attribute) != value) {
            element.setAttribute(attribute, value);
        }

    }

    this.setElementClass = function (element, value) {
        con_info_panel.setElementAttribute(element, 'class', value);
    }

    this.clearElementClass = function (element, value) {
        if (element != null) {
            var classNames = element.getAttribute('class');
            if (classNames != null && classNames.length > 0 && classNames.length >= value.length) {
                classNames = classNames.split(' ');
                for (var i = 0; i < classNames.length; i++) {
                    if (classNames[i] == value) {
                        classNames.splice(i, 1);
                        this.setElementClass(element, classNames.join(' '));
                        return;
                    }
                }
            }
        }
    }

    this.addElementClass = function (element, value) {
        if (element != null) {
            var classNames = element.getAttribute('class');
            if (classNames == null || classNames.length == 0) {
                classNames = value;
            } else {
                classNames += ' ' + value;
            }
            this.setElementClass(element, classNames);
        }
    }

    this.hasElementClass = function (element, value) {
        return element != null
            && element.getAttribute('class') != null
            && element.getAttribute('class').indexOf(value) >= 0;
    }


    this.setElementText = function (element, text) {
        if (element != null && element.textContent != text) {
            element.textContent = text;
        }
    }

    this.getLines = function (text) {
        var lines = [];
        if (text != null && text != '') {
            var rawLines = text.split('\n');
            for (var i = 0; i < rawLines.length; i++) {
                var line = rawLines[i].trim();
                if (line.length > 0 && line[0] != '#') {
                    if (line.length > 512) {
                        line = line.substring(0, 512) + '...';
                    }
                    lines.push(line);
                }
            }
        }
        return lines;
    }


    var refreshDelay = 40;
    var msgStep = 3;
    var msgReloadDelay = 5000;
    var pageSwitchDelay = 60000;

    var msgReloadAge = msgReloadDelay;
    var msgLinesElements = null;
    var msgLinesContent = {
        cs: {
            lastModified: '',
            msgIdPrefix: 'mcs',
            msgs: []
        },
        en: {
            lastModified: '',
            msgIdPrefix: 'men',
            msgs: [],
        },
    };

    var pageListUrl = 'data/pages.txt';
    var pageSwitchAge = 0;
    var currentPage = '';

    var refresh = function () {
        moveAllMsgLines();
        msgReloadAge += refreshDelay;
        if (msgReloadAge >= msgReloadDelay) {
            msgReloadAge = 0;
            reloadMsgLines();
        }

        pageSwitchAge += refreshDelay;
        if (pageSwitchAge >= pageSwitchDelay) {
            pageSwitchAge = 0;
            con_info_panel.requestText(pageListUrl, reloadedPageList, false);
        }
    }

    var processNewMsgContent = function (content, text, lastModified) {
        if (content.lastModified != lastModified) {
            content.msgs = con_info_panel.getLines(text);
            content.lastModified = lastModified;
            return true;
        } else {
            return false;
        }
    }

    var reloadedCS = function (text, lastModified) {
        processNewMsgContent(msgLinesContent.cs, text, lastModified);
    }
    var reloadedEN = function (text, lastModified) {
        processNewMsgContent(msgLinesContent.en, text, lastModified);
    }

    var reloadMsgLines = function () {
        con_info_panel.requestText('data/messages.cs.txt', reloadedCS, false);
        con_info_panel.requestText('data/messages.en.txt', reloadedEN, false);
    }

    var moveAllMsgLines = function () {
        if (msgLinesElements.length > 0) {
            moveMsgLine(msgLinesElements[0], msgLinesContent.cs);
        }
        if (msgLinesElements.length > 1) {
            moveMsgLine(msgLinesElements[1], msgLinesContent.en);
        }
    }

    var getPixels = function (valueStr) {
        var value = 0;
        if (valueStr != '' && valueStr != null) {
            value = parseInt(valueStr);
        }
        if (value == null) {
            value = 0
        }
        return value;
    }

    var findMsgByText = function(text, content) {
        if (text != '') {
            for (var i = 0; i < content.msgs.length; i++) {
                if (content.msgs[i] == text) {
                    return i;
                }
            }
        }
        return -1;
    }

    var refreshMsg = function (msg, content) {
        if (msg.id != null && msg.id.startsWith(content.msgIdPrefix)) {
            var msgIndex = findMsgByText(msg.textContent, content);
            if (msgIndex < 0 || msg.id != (content.msgIdPrefix + msgIndex)) {
                msgIndex = parseInt(msg.id.substring(content.msgIdPrefix.length));
                if (msgIndex < content.msgs.length) {
                    msg.textContent = content.msgs[msgIndex];
                    con_info_panel.setElementClass(msg, 'msg');
                } else {
                    msg.textContent = '';
                    con_info_panel.setElementClass(msg, 'msg noMsg');
                }
            }
        }
    }

    var moveMsgLine = function (owner, content) {
        var msgs = owner.getElementsByClassName('msg');
        var nextAbsolute = owner.offsetWidth;
        for (var i = 0; i < msgs.length; i++) {
            var msg = msgs[i];
            msg.style.left = (getPixels(msg.style.left) - msgStep) + 'px';
            nextAbsolute = Math.max(nextAbsolute, msg.offsetLeft + msg.offsetWidth);
        }
        for (var i = 0; i < msgs.length; i++) {
            var msg = msgs[i];
            if (getPixels(msg.style.left) + msg.offsetWidth <= 0) {
                msg.style.left = nextAbsolute + 'px';
                refreshMsg(msg, content);
                nextAbsolute += msg.offsetWidth;
            }
        }
    }

    var reloadedPageList = function (text, lastModified) {
        var pages = con_info_panel.getLines(text);
        var currentIndex = -1;
        for(var i = 0; i < pages.length; i++) {
            if (pages[i] == currentPage) {
                currentIndex = i;
            }
        }

        if (pages.length > 0) {
            currentPage = pages[(currentIndex + 1) % pages.length];

            var frameElement = document.getElementById('contentFrame');
            con_info_panel.setElementAttribute(frameElement, 'src', currentPage + '.html');
            con_info_panel.clearElementClass(frameElement, 'hidden');
        } else {
            var frameElement = document.getElementById('contentFrame');
            con_info_panel.addElementClass(frameElement, 'hidden');
        }
    }

    var delayedStart = function (text, lastModified) {
        reloadedPageList(text, lastModified);
        setInterval(refresh, refreshDelay);
    }

    this.start = function () {
        msgLinesElements = document.getElementsByClassName('msgLine');
        con_info_panel.requestText(pageListUrl, delayedStart, false);
    }
}
