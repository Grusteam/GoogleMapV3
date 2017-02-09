// объявление глобальных переменных
console.log('то работает то нет')
var map,
	currentOldMarker,
	newMarker,
	currentData,
	LatLng,
	mouseX,
	mouseY,
	update_timeout = null,
	defaultCenter = {
		lat: 47.2,
		lng: 39.7
	};


(function() {

	//следим за курсором
	document.onmousemove = function(e) {
		mouseX = e.pageX;
		mouseY = e.pageY;
		mouseX = mouseX > 250 ? e.pageX - 250 : 0
		mouseY = mouseY > 350 ? e.pageY - 350 : 0
	}

	// запарашиваем данные из файла	
	$.ajax('/data/data.json', {
		type: 'GET',
		success: function(data) {
			currentData = data;
			map = new google.maps.Map(document.getElementById('map'), {
				zoom: 6,
				center: currentData[0] ? currentData[currentData.length - 1].LatLng : defaultCenter
			});
			init(currentData);
		}
	});
}());

//после сработки аякса
function init(loadedData) {
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
			update_timeout = setTimeout(function() {
				hideInputForm();
				moveInfoform(mouseX, mouseY);
				currentOldMarker = item;
				LatLng = currentOldMarker.LatLng;
				shortCoords();
				infoformRender();
				$('[showedInfoform]').show();
			}, 200);
		});
		currentMarker.addListener('dblclick', function() {
			clearTimeout(update_timeout);
			//hideInfoform();
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
			//hideInfoform();
		});

		newMarker.addListener('dblclick', function() {
			shortCoords()
			updateForm('new');
			showInputForm();
		});

		hideInputForm();
		//hideInfoform();
	});
};

function shortCoords() {
	shortLat = Math.round(LatLng.lat * 10000) / 10000;
	shortLng = Math.round(LatLng.lng * 10000) / 10000;
}

//Меняем содержание формы заполнения
function updateForm(state) {
	if (state == 'new') {
		$('[buttonSave]').html('Дальше');
		$('[InputFormDate]').val('');
		$('[dataLatLng]').html(shortLat + ', ' + shortLng);
		$('[InputFormHeader]').val('');
		$('[InputFormdescription]').val('');
		$('[inputPhoto]').val('');
		$('[buttonDelete]').hide();
	} else if (state == 'old') {
		$('[buttonSave]').html('Редактировать');
		$('[InputFormDate]').val(currentOldMarker.date);
		$('[dataLatLng]').html(shortLat + ', ' + shortLng);
		$('[InputFormHeader]').val(currentOldMarker.header);
		$('[InputFormdescription]').val(currentOldMarker.description);
		$('[inputPhoto]').val(currentOldMarker.photo);
		$('[buttonDelete]').show();
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
		photo: $('[inputPhoto]').val()
	};
	currentData.push(x);
	$('[button-secretbutton]').show();
};

//показать-скрыть формы
function showInputForm() {
	$('[InputForm]').show();
};

function hideInputForm() {
	$('[InputForm]').hide();
};

function hideInfoform() {
	$('[showedInfoform]').hide();
};

function photoPrepare(string) {
	let y = string.split(' ');
	let z = '';
	y.forEach(function(it) {
		z += '<a href="' + it + '"><img src="' + it + '" width="100" /></a>';
	})
	return z;
};

//заполнение Infoform
function infoformRender() {
	$('#field1').html(shortLat + ', ' + shortLng);
	$('#field2').html(currentOldMarker.date);
	$('#field3').html(currentOldMarker.header);
	$('#field4').html(currentOldMarker.description);
	$('#field5').html(photoPrepare(currentOldMarker.photo));
};

//Перемещалка
function moveInfoform(x, y) {
	$('.infoform').css('left', x);
	$('.infoform').css('top', y);
};

//установка обработчиков событий кнопок
function setupButtonsListeners() {
	$('[buttonCancel]').on('click', function() {
		hideInputForm();
	});

	$('[buttonSave]').on('click', function() {
		newMarker.setMap(null)
		updateCurrentData();
		hideInputForm();
		$('[pChanges]').hide();
		$('[buttonSend]').show();
	});

	$('[buttonSend]').on('click', function() {
		sendData();
		hideInputForm();
		$('[pChanges]').show();
		$('[buttonSend]').hide();
	});

	$('[showedInfoform]').on('click', function() {
		//hideInfoform();
	});


	$('[buttonDelete]').on('click', function() {
		currentOldMarker.LatLng.lat = 0;
		currentOldMarker.LatLng.lng = 0;
		updateCurrentData();
		hideInputForm();
		$('[pChanges]').hide();
		$('[buttonSend]').show();
	});
};


// ajax отправка данных
function sendData() {
	$.ajax('/api', {
		data: JSON.stringify(currentData),
		type: 'POST',
		success: function(responseData) {
			console.info('Отправлено', responseData);
		}
	});
};