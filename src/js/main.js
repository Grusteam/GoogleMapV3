// объявление глобальных переменных
var 
	localData,
	toLocalStorage,
	map,
	currentOldMarker,
	newMarker,
	currentData,
	LatLng,
	mouseX,
	mouseY,
	fotoArr = [],
	currentKml,
	drawedPath,
	currentPath = [],
	markers = [],
	update_timeout = null,
	successIndexes = ['ru', 'net', 'com', 'jpg', 'png', 'http', 'www', 'img', 'https'],
	Icon = 'images/100.png',
	defaultCenter = {
		lat: 47.2,
		lng: 39.7
	};


//следим за курсором
function mouseListener() {
	document.onmousemove = function(e) {
		// появление инфоформ
		formX = e.pageX > $(window).width() - 220 ? $(window).width() - 440 : e.pageX > 220 ? e.pageX - 220 : 0;
		formY = e.pageY < $('[data-infoform]').height() + 20 ? 0 : e.pageY - $('[data-infoform]').height() - 35;
		// перемещение форм
		mouseX = e.pageX > 0 ? e.pageX : 0;
		mouseY = e.pageY > 0 ? e.pageY : 0;
	};
}

start();

// запарашиваем данные из файла	
function start() {
	// localData = localStorage.getItem('G3DATA');
	// localData = false;
	if (localData) {
		currentData = JSON.parse(localData);
		mapRender();
		console.log('localData');
	} else {
		$.ajax('/data/data.json', {
			type: 'GET',
			cache: false,
			success: function(data) {
				// console.log(typeof data); // разный тип при разном разхмещении
				currentData = data; // для локалхоста
				// currentData = JSON.parse(data); // для серевера
				mapRender();
				setLocalStorage();
			}
		});
		console.log('webData');
	}
}

function setLocalStorage() {
	toLocalStorage = JSON.stringify(currentData);
	localStorage.setItem('G3DATA', toLocalStorage);
}

// рендер карты
function mapRender() {
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 6,
		center: currentData[0] ? currentData[currentData.length - 1].LatLng : defaultCenter,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
			position: google.maps.ControlPosition.TOP_RIGHT
		}
	});
	init();
}

//после сработки аякса
function init() {
	mouseListener();
	setupButtonsListeners();
	setupMarkersListeners();
	currentMarkersRender();
}


//рендер старых маркеров из полыченной информации
function currentMarkersRender() {
	currentData.forEach(function(item, i, arr) {
		creaeteCurrentMarker(item, i);
	});
}

//создание замыканий старых маркеров и обработка событий
function creaeteCurrentMarker(item, i) {
	var tempMark = new google.maps.Marker({
		position: item.LatLng,
		map: map,
		title: item.header,
		icon: Icon
	});

	markers.push(tempMark);

	tempMark.addListener('click', function() {
		hideInfoform();
		currentOldMarker = item;
		currentOldMarker.I = i;
		LatLng = currentOldMarker.LatLng;
		// map.panTo(LatLng);
		// if (map.getZoom() < 9){
		// map.setZoom(10);
		// };
		infoformRender();
		drag();
		hideFotoform();
		hideInputForm();
		if (newMarker) newMarker.setMap(null);
		update_timeout = setTimeout(function() {
			if (currentKml) currentKml.setMap(null);
			placeInfoform(formX, formY);
			showInfoform();
		}, 200);
	});

	tempMark.addListener('dblclick', function() {
		if (newMarker) newMarker.setMap(null);
		clearTimeout(update_timeout);
		hideInfoform();
		updateForm('old');
		showInputForm();
	});

}

// скрытие маркера на текущей карте
function setMapOnAll(map) {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
	}
}

function clearMarkers() {
	setMapOnAll(null);
}

//установка обработчиков событий нового маркера
function setupMarkersListeners() {
	//клик по карте
	map.addListener('click', function(e) {
		LatLng = e.latLng.toJSON();
		currentPath.push(LatLng);
		if (newMarker) newMarker.setMap(null);
		newMarker = new google.maps.Marker({
			position: LatLng,
			map: map,
			animation: google.maps.Animation.DROP,
			icon: Icon
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

		// hideInputForm();
		hideInfoform();
		hideFotoform();
	});
}

//рендер кмл
function kmlRender(x) {
	currentKml = new google.maps.KmlLayer({
		url: x,
		map: map
	});
	// клик по kml сдою
	currentKml.addListener('click', function(kmlEvent) {
		console.log('kml click');
	});
}

//установка обработчиков событий кнопок
function setupButtonsListeners() {
	$('[data-button-cancel]').on('click', function() {
		hideInputForm();
	});

	$('[data-button-delete]').on('click', function() {
		currentData[currentOldMarker.I] = 0;
		hideInputForm();
		sendData();
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
	});

	$('[closeInfoform]').on('click', function() {
		hideInfoform();
	});

	$('[data-kml]').on('click', function() {
		kmlRender(currentOldMarker.kml);
	});

	$('[closeFoto]').on('click', function() {
		hideFotoform();
	});

	$('[data-previews]').on('click', function(e) {
		fotoramaIndex = e.target.dataset.prevNum;
		initFotorama();
		showFotoform();
		hideInfoform();
	});
}

//Меняем содержание формы заполнения
function updateForm(state) {
	shortCoords();
	$('[data-lat-lng]').attr('value', shortLat + ', ' + shortLng);
	$('[data-button-delete]').hide();
	if (state == 'new') {
		$('[data-drag-form]').html('Добавление новой точки');
		$('[data-input-form-date]').val('');
		$('[data-input-form-header]').val('');
		$('[data-input-form-description]').val('');
		$('[data-input-photo]').val('');
		$('[data-input-kml]').val('');
		$('[data-draw-path]').show();
	} else if (state == 'old') {
		$('[data-drag-form]').html('Редактирование точки');
		$('[data-input-form-date]').val(currentOldMarker.date);
		$('[data-input-form-header]').val(currentOldMarker.header);
		$('[data-input-form-description]').val(currentOldMarker.description);
		$('[data-input-photo]').val(currentOldMarker.photo);
		$('[data-input-kml]').val(currentOldMarker.kml);
		$('[data-draw-path]').hide();
		if (currentOldMarker.kml === '') {
			$('[data-draw-path]').show();
		}
	}
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

	if (x.header === 'del') {
		$('[data-button-delete]').show();
	} else {
		next(x);
	}
}

function next(x) {
	hideInputForm();
	for (var i = currentData.length - 1; i >= 0; i--) {
		if (x.LatLng.lat == currentData[i].LatLng.lat) {
			currentData[i] = x;
			sendData();
			return;
		}
	}
	currentData.push(x);
	sendData();
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
		if (dragstart1 === true) {
			moveInfoform(mouseX - offsetX - 20, mouseY - 30);
		}
	});

	$(window).on('mousemove', function() {
		if (dragstart2 === true) {
			moveInputDataForm(mouseX - offsetX - 20, mouseY - 30);
		}
	});

	$(window).on('mousemove', function() {
		if (dragstart3 === true) {
			moveFotoForm(mouseX - offsetX, mouseY - 10);
		}
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
	if (x < 0) {
		x = 0;
	}
	if (y < 0) {
		y = 0;
	}
	if (x + 440 > window.innerWidth) {
		x = window.innerWidth - 440;
	}
	if (y + $('[data-infoform]').height() + 20 > window.innerHeight) {
		y = window.innerHeight - $('[data-infoform]').height() - 20;
	}
	$('[data-infoform]').css('left', x);
	$('[data-infoform]').css('top', y);
}

function moveInputDataForm(x, y) {
	if (x < 0) {
		x = 0;
	}
	if (y < 0) {
		y = 0;
	}
	if (x + $('[InputForm]').width() + 40 > window.innerWidth) {
		x = window.innerWidth - $('[InputForm]').width() - 40;
	}
	if (y + $('[InputForm]').height() + 20 > window.innerHeight) {
		y = window.innerHeight - $('[InputForm]').height() - 20;
	}
	$('[InputForm]').css('left', x);
	$('[InputForm]').css('top', y);
}

function placeFotoform() {
	var
		x = window.innerWidth - 800,
		y = 0;
	moveFotoForm(x, y);
}

function moveFotoForm(x, y) {
	if (x < 0) {
		x = 0;
	}
	if (y < 0) {
		y = 0;
	}
	if (x + $('[data-fotoform]').width() > window.innerWidth) {
		x = window.innerWidth - 800;
	}
	if (y + $('[data-fotoform-img]').height() > window.innerHeight) {
		y = window.innerHeight - $('[data-fotoform-img]').height();
	}
	$('[data-fotoform]').css('left', x);
	$('[data-fotoform]').css('top', y);
}

//поле фотографий
var imgTemplate = $('[data-fotoform-img]').clone().html();

function photoPrepare(string) {
	var fotohtml = [];
	fotoArr = [];
	var y = string.split(' ');
	var z = '';
	y.forEach(function(it, i) {
		fotoArr.push(it);
		forRama = '<img src="' + it + '">';
		var tempString = imgTemplate.replace('{{##}}', forRama);
		fotohtml.push(tempString);
		z += '<img src="' + it + '" class="img-preview" data-prev-num="' + (i + 1) + '" />';
	});

	$('[data-fotoform-img]').html(fotohtml);
	for (var i = successIndexes.length - 1; i >= 0; i--) {
		if (string.indexOf(successIndexes[i]) >= 0) {
			return z;
		}
	}
	return '';
}

//заполнение Infoform
function infoformRender() {
	var kml = $('[data-kml]');
	if (currentOldMarker.kml === undefined || currentOldMarker.kml === '') {
		kml.hide();
	} else {
		kml.show();
	}

	shortCoords();
	$('[data-kml] span').html('Маршрут');
	$('#field1').html(shortLat + ', ' + shortLng);
	var x = currentOldMarker.date;
	$('#field2').html(x.substr(8, 2) + '.' + x.substr(5, 2) + '.' + x.substr(0, 4));
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

function clearData(arr) {
	var clearArr = arr.filter(function(it, i, arr) {
		return it !== 0 && it !== null;
	});
	return clearArr;
}

//отдельная секция фоторамы
var count,
	paginationDot = $('.dot-tmpl').clone().html(),
	paginationStr = $('.pagination').html(),
	isThrottled = false,
	fotoramaIndex = 1,
	fotoramaWdth = $('.data-fotoform').width(),
	paginationHtmlArr;


function initFotorama() {
	dataOfPad = '[data-dot-ind="' + fotoramaIndex + '"]';
	paginationHtmlArr = [];
	count = fotoArr.length;
	$('.pagination').html(paginationStr);

	for (var i = 1; i <= count; i++) {
		var y = paginationDot.replace('{{#}}', i);
		paginationHtmlArr.push(y);
	}

	$('.pagination').append(paginationHtmlArr);
	fotoramaRender();
}

function makeBlue() {
	$(dataOfPad).attr('src', 'images/635d9b.png');
}

function makeGreen() {
	$(dataOfPad).attr('src', 'images/5d949b.png');
}

$('[data-area="left"]').click(throttle(left, 330));
$('[data-area="right"]').click(throttle(right, 330));

function left() {
	makeBlue();
	fotoramaIndex--;
	if (fotoramaIndex < 1) {
		fotoramaIndex = count;
	}
	fotoramaRender();
}

function right() {
	makeBlue();
	fotoramaIndex++;
	if (fotoramaIndex > count) {
		fotoramaIndex = 1;
	}
	fotoramaRender();
}

function fotoramaRender() {
	dataOfPad = '[data-dot-ind="' + fotoramaIndex + '"]';
	makeGreen();
	var n = -(fotoramaIndex * fotoramaWdth - fotoramaWdth) + 'px';
	$('.images').css('margin-left', n);
}

$('.pagination').click(function(e) {
	makeBlue();
	fotoramaIndex = +e.target.dataset.dotInd;
	fotoramaRender();
});

// пропуск запросов Ф в промежутке времени
function throttle(func, ms) {
	var
		savedArgs,
		savedThis;

	function wrapper() {
		if (isThrottled) {
			savedArgs = arguments;
			savedThis = this;
			return;
		}
		func.apply(this, arguments);
		isThrottled = true;
		setTimeout(function() {
			isThrottled = false;
			if (savedArgs) {
				wrapper.apply(savedThis, savedArgs);
				savedArgs = savedThis = null;
			}
		}, ms);
	}
	return wrapper;
}

// ajax отправка данных через localhost
function sendData() {
	currentData = clearData(currentData);
	$.ajax('/api', {
		data: JSON.stringify(currentData),
		type: 'POST',
		success: function(responseData) {
			setLocalStorage();
			clearMarkers();
			markers = [];
			currentMarkersRender(currentData);
		}
	});
}

// отправка через PHP
// function sendData() {
// 	currentData = clearData(currentData);
// 	var jsonString = JSON.stringify(currentData);
// 	$.ajax({
// 		url: '../write.php',
// 		data: {
// 			'jsonString': jsonString
// 		},
// 		type: 'POST'
// 	});
// 	setLocalStorage();
// 	clearMarkers();
// 	markers = [];
// 	currentMarkersRender(currentData);
// }