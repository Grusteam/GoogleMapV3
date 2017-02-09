Установка
npm i
Установка зависимостей для сборки
npm i jquery --save
Установка зависимостей для продакшена
npm i gulp-concat --save-dev

Описание команд Gulp
gulp clean - удаляет папку build
gulp image - сжимает изображение в src и переносит в build
gulp module - переносит в build зависимости из dependencies
gulp - стандартная команда, собирает build, запускает сервер и открывает браузер, начинает отслеживание файлов