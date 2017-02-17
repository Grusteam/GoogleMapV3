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
		// появление инфоформ
		formX = e.pageX > $(window).width() - 220 ? $(window).width() - 440 : e.pageX > 220 ? e.pageX - 220 : 0;
		formY = e.pageY < $('[data-infoform]').height() + 20 ? 0 : e.pageY - $('[data-infoform]').height() - 35 ;
		// перемещение форм
		mouseX = e.pageX > 0 ? e.pageX : 0;
		mouseY = e.pageY > 0 ? e.pageY : 0;
	}
}

start();

// запарашиваем данные из файла	
function start() {
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
};

//после сработки аякса
function init(loadedData) {
	mouseListener();
	setupButtonsListeners();
	setupMarkersListeners();
	currentMarkersRender(loadedData);
}

//рендер старых маркеров из полыченной информации
function currentMarkersRender(array) {
	array.forEach(function(item, i, arr) {
		creaeteCurrentMarker(item);
	});
}

//создание замыканий старых маркеров и обработка событий
function creaeteCurrentMarker(item) {
	let currentMarker = new google.maps.Marker({
		position: item.LatLng,
		map: map,
		title: item.header
	});

	currentMarker.addListener('click', function() {
		hideInfoform();
		currentOldMarker = item;
		LatLng = currentOldMarker.LatLng;
		infoformRender();
		drag();
		hideFotoform();
		hideInputForm();
		update_timeout = setTimeout(function() {
			!!currentKml && currentKml.setMap(null);
			placeInfoform(formX, formY);
			showInfoform();
		}, 200);
	});

	currentMarker.addListener('dblclick', function() {
		clearTimeout(update_timeout);
		hideInfoform();
		updateForm('old');
		showInputForm();
	});

}

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
			hideFotoform();
		});

		newMarker.addListener('dblclick', function() {
			updateForm('new');
			showInputForm();
		});

		hideInputForm();
		hideInfoform();
		hideFotoform()
	});
}

//рендер кмл
function kmlRender(x) {
	if (x == undefined || x == "") {
		$('[data-kml] span').html('еще нет');
	};
	currentKml = new google.maps.KmlLayer({
		url: x,
		map: map
	});
}

//установка обработчиков событий кнопок
function setupButtonsListeners() {

	$('[data-button-cancel]').on('click', function() {
		hideInputForm();
	});

	$('[data-close-input-cross]').on('click', function() {
		hideInputForm();
	});

	$('[data-close-info-cross]').on('click', function() {
		hideInfoform();
	});

	$('[data-close-foto-cross]').on('click', function() {
		hideFotoform();
		showInfoform();
	});

	$('[data-button-save]').on('click', function() {
		updateCurrentData();
		// creaeteCurrentMarker(currentData[currentData.length - 1]);
		hideInputForm();
		sendData();
	});


	// $('[buttonDelete]').on('click', function() {
	// 	console.log('del')
	// });

	$('[closeInfoform]').on('click', function() {
		hideInfoform();
	});

	$('[data-kml]').on('click', function() {
		kmlRender(currentOldMarker.kml);
	});

	$('[closeFoto]').on('click', function() {
		hideFotoform();
	});

	$('[data-previews]').on('click', function() {
		showFotoform();
		hideInfoform();
	});

	$('[data-fotoform-img]').on('click', function() {
		fotoI = fotoI < fotoArr.length - 1 ? fotoI + 1 : 0;
		var q = '<img src="' + fotoArr[fotoI] + '" width="800" />';
		
		$('[data-fotoform-img]').fadeOut(0);
		$('[data-fotoform-img]').html(q);
		$('[data-fotoform-img]').fadeIn(150);
	});
}

//Меняем содержание формы заполнения
function updateForm(state) {
	shortCoords();
	if (state == 'new') {
		$('[data-button-next-step] span').html('Дальше');
		$('[data-input-form-date]').val('');
		$('[data-lat-lng]').attr('value', shortLat + ', ' + shortLng);
		$('[data-input-form-header]').val('');
		$('[data-input-form-description]').val('');
		$('[data-input-photo]').val('');
		$('[data-input-kml]').val('');
		$('[buttonDelete]').fadeOut(300);
	} else if (state == 'old') {
		$('[data-input-form-date]').val(currentOldMarker.date);
		$('[data-lat-lng]').attr('value', shortLat + ', ' + shortLng);
		$('[data-input-form-header]').val(currentOldMarker.header);
		$('[data-input-form-description]').val(currentOldMarker.description);
		$('[data-input-photo]').val(currentOldMarker.photo);
		$('[data-input-kml]').val(currentOldMarker.kml);
		$('[buttonDelete]').fadeIn(300);
	};
}

//запись введенных данных из формы в текущий массив данный
function updateCurrentData() {
	var x = {
		LatLng: {
			lat: LatLng.lat,
			lng: LatLng.lng
		},
		date: $('[data-input-form-date]').val(),
		header: $('[data-input-form-header]').val(),
		description: $('[data-input-form-description]').val(),
		photo: $('[data-input-photo]').val(),
		kml: $('[data-input-kml]').val()
	};

	for (var i = currentData.length - 1; i >= 0; i--) {
		if (x['LatLng']['lat'] == currentData[i]['LatLng']['lat']) {
			currentData[i] = x;
			return;
		};
	};
	currentData.push(x);
}

function drag() {
	var 
		dragstart1,
		dragstart2,
		dragstart3,
		offsetX,
		offset;


	$('[data-infoform-head]').on('mousedown', function() {
		dragstart1 = true;
		offset = $(this).offset();
		offsetX = mouseX - offset.left;
	});

	$('[data-drag-form]').on('mousedown', function() {
		dragstart2 = true;
		offset = $(this).offset();
		offsetX = mouseX - offset.left;
	});

	$('[data-move]').on('mousedown', function() {
		dragstart3 = true;
		offset = $(this).offset();
		offsetX = mouseX - offset.left;
	});

	$(window).on('mousemove', function() {
		if (dragstart1 == true) {
			moveInfoform(mouseX - offsetX - 20, mouseY - 30);
		};
	});

	$(window).on('mousemove', function() {
		if (dragstart2 == true) {
			moveInputDataForm(mouseX - offsetX - 20, mouseY - 30);
		};
	});

	$(window).on('mousemove', function() {
		if (dragstart3 == true) {
			moveFotoForm(mouseX - offsetX, mouseY - 10);
		};
	});

	$(window).on('mouseup', function() {
		dragstart1 = dragstart2 = dragstart3 = false;
	});

	$('img').on('dragstart', function(event) {
		event.preventDefault();
	});
}

//Переместить при создании
function placeInfoform(x, y) {
	$('[data-infoform]').css('left', x);
	$('[data-infoform]').css('top', y);
}

//Переместить при перетаскивании
function moveInfoform(x, y) {
	if (x < 0) {x = 0};
	if (y < 0) {y = 0};
	if (x + 440 > window.innerWidth) {x = window.innerWidth - 440};
	if (y + $('[data-infoform]').height() + 20 > window.innerHeight) {
		y = window.innerHeight - $('[data-infoform]').height() - 20
	};
	$('[data-infoform]').css('left', x);
	$('[data-infoform]').css('top', y);
}

function moveInputDataForm(x, y) {
	if (x < 0) {x = 0};
	if (y < 0) {y = 0};
	if (x + $('[InputForm]').width() + 40 > window.innerWidth) {x = window.innerWidth - $('[InputForm]').width() - 40};
	if (y + $('[InputForm]').height() + 20 > window.innerHeight) {
		y = window.innerHeight - $('[InputForm]').height() - 20
	};
	$('[InputForm]').css('left', x);
	$('[InputForm]').css('top', y);
}

function placeFotoform() {
	let
		x = window.innerWidth - 800,
		y = 0;
	moveFotoForm(x, y);
}

function moveFotoForm(x, y) {
	if (x < 0) {x = 0};
	if (y < 0) {y = 0};
	if (x + $('[data-fotoform-img]').width() > window.innerWidth) {x = window.innerWidth - 800};
	if (y + $('[data-fotoform-img]').height() > window.innerHeight) {
		y = window.innerHeight - $('[data-fotoform-img]').height() + 5
	};
	$('[data-fotoform]').css('left', x);
	$('[data-fotoform]').css('top', y);
}

//поле фотографий
function photoPrepare(string) {
	fotoArr = [];
	let y = string.split(' ');
	let z = '';
	y.forEach(function(it) {
		fotoArr.push(it);
		z += '<img src="' + it + '" class="img-preview" />';
	})
	fotoI = 0;
	w = '<img src="' + fotoArr[fotoI] + '" width="800" />';
	for (var i = successIndexes.length - 1; i >= 0; i--) {
		if (string.indexOf(successIndexes[i]) >= 0) {
			$('[data-fotoform-img]').html(w);
			return z;
		};
	};
	return '';
}
//заполнение Infoform
function infoformRender() {
	shortCoords();
	$('[data-kml] span').html('Маршрут');
	$('#field1').html(shortLat + ', ' + shortLng);
	let x = currentOldMarker.date;
	$('#field2').html(x.substr(8, 2) + '.' + x.substr(5, 2)  + '.' + x.substr(0, 4));
	$('#field3').html(currentOldMarker.header);
	$('#field4').html(currentOldMarker.description);
	$('[data-previews]').html(photoPrepare(currentOldMarker.photo));
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
	$('[data-infoform]').fadeOut(300);
}

function showInfoform() {
	hideFotoform();
	$('[data-infoform]').fadeIn(300);
}

function showFotoform() {
	placeFotoform();
	$('[data-fotoform]').fadeIn(300);
}

function hideFotoform() {
	$('[data-fotoform]').fadeOut(300);
}

// ajax отправка данных
function sendData() {
	$.ajax('/api', {
		data: JSON.stringify(currentData),
		type: 'POST',
		success: function(responseData) {
		currentMarkersRender(currentData);
		}
	});
}