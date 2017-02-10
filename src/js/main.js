// объявление глобальных переменных
var map,
	currentOldMarker,
	newMarker,
	currentData,
	LatLng,
	mouseX,
	mouseY,
	fotoI,
	fotoArr,
	currentKml,
	update_timeout = null,
	successIndexes = ['ru', 'net', 'com', 'jpg', 'png', 'http', 'www', 'img', 'https'],
	defaultCenter = {
		lat: 47.2,
		lng: 39.7
	};

//следим за курсором
function mouseListener() {
	document.onmousemove = function(e) {
		mouseX = e.pageX;
		mouseY = e.pageY;
		formX = mouseX > $(window).width() - 250 ? $(window).width() - 500 : mouseX > 250 ? e.pageX - 250 : 0
		formY = mouseY < 300 ? 0 : e.pageY - 320
	}
}

// запарашиваем данные из файла	
(function() {
	$.ajax('/data/data.json', {
		type: 'GET',
		success: function(data) {
			currentData = data;
			map = new google.maps.Map(document.getElementById('map'), {
				zoom: 6,
				center: currentData[0] ? currentData[currentData.length - 1].LatLng : defaultCenter,
				mapTypeControlOptions: {
					style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
					position: google.maps.ControlPosition.TOP_RIGHT
				}
			});
			init(currentData);
		}
	});
}());
//после сработки аякса
function init(loadedData) {
	mouseListener();
	setupButtonsListeners();
	setupMarkersListeners();
	currentMarkersRender(loadedData);
};

//рендер старых маркеров из полыченной информации
function currentMarkersRender(array) {
	array.forEach(function(item, i, arr) {
		let currentMarker = new google.maps.Marker({
			position: item.LatLng,
			map: map,
			title: item.header
		});

		currentMarker.addListener('click', function() {
			currentOldMarker = item;
			LatLng = currentOldMarker.LatLng;
			infoformRender();
			drag();
			hideInputForm();
			placeInfoform(formX, formY);
			update_timeout = setTimeout(function() {
				!!currentKml && currentKml.setMap(null);
				showInfoForm();
			}, 200);
		});

		currentMarker.addListener('dblclick', function() {
			clearTimeout(update_timeout);
			hideInfoform();
			updateForm('old');
			showInputForm();
		});
	});
};

//установка обработчиков событий нового маркера
function setupMarkersListeners() {
	//клик по карте
	map.addListener('click', function(e) {
		LatLng = e.latLng.toJSON();
		newMarker && newMarker.setMap(null);
		newMarker = new google.maps.Marker({
			position: LatLng,
			map: map
		});

		//обработка новых маркеров
		newMarker.addListener('click', function() {
			hideInputForm();
			hideInfoform();
		});

		newMarker.addListener('dblclick', function() {
			updateForm('new');
			showInputForm();
		});

		hideInputForm();
		hideInfoform();
	});
};

//рендер кмл
function kmlRender(x) {
	if (x == undefined || x == "") {
		$('[kmlToggle]').html('нет маршрута');
	};
	currentKml = new google.maps.KmlLayer({
		url: x,
		map: map
	});
}

//установка обработчиков событий кнопок
function setupButtonsListeners() {

	$('[buttonCancel]').on('click', function() {
		hideInputForm();
	});

	$('[buttonNextStep]').on('click', function() {
		// newMarker.setMap(null)
		updateCurrentData();
		hideInputForm();
		$('[pChanges]').fadeOut(300);
		$('[buttonSend]').fadeIn(300);
	});

	$('[buttonSend]').on('click', function() {
		sendData();
		hideInputForm();
		$('[pChanges]').fadeIn(300);
		$('[buttonSend]').fadeOut(300);
	});

	$('[buttonDelete]').on('click', function() {
		currentOldMarker.LatLng.lat = 0;
		currentOldMarker.LatLng.lng = 0;
		updateCurrentData();
		hideInputForm();
		$('[pChanges]').fadeOut(300);
		$('[buttonSend]').fadeIn(300);
	});

	// $('[showedInfoform]').on('click', function() {
	// 	hideInfoform();
	// });

	$('[closeInfoform]').on('click', function() {
		hideInfoform();
	});

	$('[kmlToggle]').on('click', function() {
		kmlRender(currentOldMarker.kml);
	});

	$('[closeFoto]').on('click', function() {
		hideFotoForm();
	});

	$('[fotoField]').on('click', function() {
		showFotoForm();
	});

	$('[fotoFormImg]').on('click', function() {
		fotoI = fotoI < fotoArr.length - 1 ? fotoI + 1 : 0;
		q = '<img src="' + fotoArr[fotoI] + '" width="800" />';
		$('[fotoFormImg]').html(q);
	});
}

//Меняем содержание формы заполнения
function updateForm(state) {
	shortCoords();
	if (state == 'new') {
		$('[buttonNextStep] span').html('Дальше');
		$('[InputFormDate]').val('');
		$('[dataLatLng]').html(shortLat + ', ' + shortLng);
		$('[InputFormHeader]').val('');
		$('[InputFormdescription]').val('');
		$('[inputPhoto]').val('');
		$('[inputKml]').val('');
		$('[buttonDelete]').fadeOut(300);
	} else if (state == 'old') {
		$('[buttonNextStep] span').html('Редактировать');
		$('[InputFormDate]').val(currentOldMarker.date);
		$('[dataLatLng]').html(shortLat + ', ' + shortLng);
		$('[InputFormHeader]').val(currentOldMarker.header);
		$('[InputFormdescription]').val(currentOldMarker.description);
		$('[inputPhoto]').val(currentOldMarker.photo);
		$('[inputKml]').val(currentOldMarker.kml);
		$('[buttonDelete]').fadeIn(300);
	};
};

//запись введенных данных из формы в текущий массив данный
function updateCurrentData() {
	let x = {
		LatLng: {
			lat: LatLng.lat,
			lng: LatLng.lng
		},
		date: $('[InputFormDate]').val(),
		header: $('[InputFormHeader]').val(),
		description: $('[InputFormdescription]').val(),
		photo: $('[inputPhoto]').val(),
		kml: $('[inputKml]').val()
	};
	currentData.push(x);
	$('[button-secretbutton]').fadeIn(300);
};

function drag() {
	var dragstart,
		dragFotoStart;

	$('[dragForm]').on('mousedown', function() {
		dragstart = true;
	});

	$('[dragFoto]').on('mousedown', function() {
		dragFotoStart = true;
	});

	$(window).on('mousemove', function() {
		if (dragstart == true) {
			moveInfoform(mouseX - 470, mouseY - 10)
		};

		if (dragFotoStart == true) {
			moveInfoform(mouseX - 470, mouseY - 10)
		};
	});

	$(window).on('mouseup', function() {
		dragFotoStart = dragstart = false;
	});
}

//поле фотографий
function photoPrepare(string) {
	fotoArr = [];
	let y = string.split(' ');
	let z = '';
	y.forEach(function(it) {
		fotoArr.push(it);
		z += '<img src="' + it + '" width="100" />';
		// z += '<a href="' + it + '"><img src="' + it + '" width="100" /></a>';
	})
	fotoI = 0;
	w = '<img src="' + fotoArr[fotoI] + '" width="800" />';
	for (var i = successIndexes.length - 1; i >= 0; i--) {
		if (string.indexOf(successIndexes[i]) >= 0) {
			$('[fotoFormImg]').html(w);
			return z;
		};
	};
	return '';
}
//заполнение Infoform
function infoformRender() {
	shortCoords();
	$('[kmlToggle]').html('показать маршрут');
	$('#field1').html(shortLat + ', ' + shortLng);
	$('#field2').html(currentOldMarker.date);
	$('#field3').html(currentOldMarker.header);
	$('#field4').html(currentOldMarker.description);
	$('#field5').html(photoPrepare(currentOldMarker.photo));
}

//читабельный вид координат
function shortCoords() {
	shortLat = Math.round(LatLng.lat * 10000) / 10000;
	shortLng = Math.round(LatLng.lng * 10000) / 10000;
}

//показать-скрыть формы
function showInputForm() {
	$('[InputForm]').fadeIn(300);
}

function hideInputForm() {
	$('[InputForm]').fadeOut(300);
}

function hideInfoform() {
	$('[showedInfoform]').fadeOut(300);
}

function showInfoForm() {
	hideFotoForm();
	$('[showedInfoform]').fadeIn(300);
}

function showFotoForm() {
	$('[fotoForm]').fadeIn(300);
}

function hideFotoForm() {
	$('[fotoForm]').fadeOut(300);
}

//Переместить при создании
function placeInfoform(x, y) {
	$('.infoform').css('left', x);
	$('.infoform').css('top', y);
}

//Переместить при перетаскивании
function moveInfoform(x, y) {
	$('.infoform').css('left', x);
	$('.infoform').css('top', y);
}

// ajax отправка данных
function sendData() {
	$.ajax('/api', {
		data: JSON.stringify(currentData),
		type: 'POST',
		success: function(responseData) {}
	});
}