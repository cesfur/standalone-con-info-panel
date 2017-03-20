/* Con Info Panel | (c) Cesfur z.s. | GNU GPL License v. 3.0 */
var con_info_panel_photos = new function () {
    var refreshDelay = 1000;
    var listReloadDelay = 30000;
    var photoRefreshDelay = 10000;

    var photoRefreshAge = photoRefreshDelay;
    var listReloadAge = 0;

    var photosListUrl = 'data/photos.txt';
    var photos = [];
    var photoslastModified = '';
    var photosSelectedIndex = -1;
    var photosSelectedIndexHistoryMax = 3;
    var photosSelectedIndexHistory = [];
    var photosMissingCount = 0;
    var photosMissingMax = 100;

    var refresh = function () {
        listReloadAge += refreshDelay;
        if (listReloadAge >= listReloadDelay) {
            console.debug('Reload requested');
            listReloadAge = 0;
            con_info_panel.requestText(photosListUrl, reloadedPhotos, false);
        }

        photoRefreshAge += refreshDelay;
        if (photoRefreshAge >= photoRefreshDelay) {
            photoRefreshAge = 0;
            refreshPhoto();
        }
    }

    var reloadedPhotos = function (text, lastModified) {
        if (lastModified != photoslastModified) {
            var newPhotos = con_info_panel.getLines(text);
            if (photosSelectedIndex >= 0 && photosSelectedIndex < photos.length) {
                var selectedName = photos[photosSelectedIndex];
                var selectedIndex = -1;
                for (var i = 0; i < newPhotos.length; i++) {
                    if (newPhotos[i] == selectedName) {
                        selectedIndex = i;
                    }
                }
                if (selectedIndex >= 0) {
                    photosSelectedIndex = selectedIndex;
                } else {
                    photosSelectedIndex = -1;
                }
            }
            photos = newPhotos;
            photoslastModified = lastModified;
            photosMissingCount = 0;
            photosSelectedIndexHistory = [];
        }
    }

    var buildPhotoUrl = function (photoName) {
        return 'data/photos/' + photoName;
    }

    var isInSelectedHistory = function (index) {
        for (var i = 0; i < photosSelectedIndexHistory.length; i++) {
            if (photosSelectedIndexHistory[i] == index) {
                return true;
            }
        }
        return false;
    }

    var addToSelectedHistory = function (index) {
        photosSelectedIndexHistory.push(index);
        while (photosSelectedIndexHistory.length > photosSelectedIndexHistoryMax) {
            photosSelectedIndexHistory.shift();
        }
    }

    var selectNextPhoto = function () {
        var newIndex = Math.floor(Math.random() * photos.length);
        while (photos.length > photosSelectedIndexHistoryMax && isInSelectedHistory(newIndex)) {
            newIndex = Math.floor(Math.random() * photos.length);
        }
        photosSelectedIndex = newIndex;
        con_info_panel.testFile(buildPhotoUrl(photos[photosSelectedIndex]), photoTested, false);
    }

    var photoTested = function (url, result, lastModified) {
        if (result == 'OK' && photosSelectedIndex < photos.length) {
            var timestamp = Math.floor(Date.parse(lastModified) / 1000);
            var photoUrl = 'url(' + buildPhotoUrl(photos[photosSelectedIndex]) + '?ts=' + timestamp + ')';
            var photoViewElement = document.getElementById('photoView');
            if (photoViewElement.style.backgroundImage != photoUrl) {
                photoViewElement.style.backgroundImage = photoUrl;
                addToSelectedHistory(photosSelectedIndex);
            }
            con_info_panel.clearElementClass(document.getElementById('photoView'), 'noPhoto');
        } else if (result == 'NOT_FOUND') {
            photosMissingCount++;
            if (photosMissingCount < photosMissingMax) {
                selectNextPhoto();
            }
        }
    }

    var refreshPhoto = function () {
        if (photos.length > 0) {
            selectNextPhoto();
        } else {
            photosSelectedIndex = -1;
            con_info_panel.addElementClass(document.getElementById('photoView'), 'noPhoto');            
        }
    }

    var delayedStart = function (text, lastModified) {
        reloadedPhotos(text, lastModified);
        setInterval(refresh, refreshDelay);
    }

    this.start = function () {
        con_info_panel.requestText(photosListUrl, delayedStart, false);
    }
}
