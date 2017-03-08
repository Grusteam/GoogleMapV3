<?php
// строка, которую будем записывать
$data = $_POST['jsonString'];
$USER = $_POST['USER'];
$url = 'data/' . $USER . '.json';


// записываем в файл текст
if (!empty($data)) {

	// открываем файл, если файл не существует,
	//делается попытка создать его
	$fp = fopen($url, "w");

	fwrite($fp, $data);

	// закрываем
	fclose($fp);
}

?>
