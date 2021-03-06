# Эмулятор МИС реализующий работу сервиса "Запись на прием к врачу" версия КУ ФЕР 3.0.1.

Эмулятор соотвествует требованиям интеграционного профиля Концентратор услуг ФЭР 3.0.1 - услуга "Запись на прием к врачу". Позволяет успешно пройти контрольные испытания ЕГИСЗ.

Поддерживает следущие сценарии:
1. Запись к врачу с поиском медицинского специалиста в выбранной медицинской организации
2. Запись к врачу с поиском медицинской организации, для записи к медицинскому специалисту выбранной должности
3. Запись на прием по направлению
4. Отмена Пользователем записи к врачу
5. Оповещение Пользователя о смене статуса записи к врачу по инициативе МО
6. Передача сведений о записях к врачу, произведенных в ИС Поставщика без обращения граждан к услуге "Запись на прием к врачу"

## Запуск эмулятора
Используйте команду ```docker-compose up```

## Порты и узлы системы
При запуске эмулятор запускает два контейнера
- Порт ```3000``` - Собственно сам эмулятор, работающий по SOAP
- Порт ```3001``` -  JSON-Прокси, работающий поверх сервиса на порту ```3000```


## Управление эмулятором
Поведение эмулятора определяется с помощью файлов:
- default.conf.yml (настройки по умолчанию)
- user.conf.yml (пользовательские настройки)

```yml
operations:
  - name: 'GetPatientInfo'
    request: 'GetPatientInfoRequest'
    response: 'GetPatientInfoResponse'
    rules: 
      - id: 'GetPatientInfoResponseReferal0'
        description: 'Стандартный ответ при referal = 0'
        path: 'get-patient-info/responses/get-patient-info-response-referal-0.xml'
        isActive: true
        isError: false
      - id: 'GetPatientInfoResponseReferal1'
        description: 'Стандартный ответ при referal = 1'
        path: 'get-patient-info/responses/get-patient-info-response-referal-1.xml'
        isActive: false
        isError: false
```
В блоке ```operations``` представлены методы, доступные для данного SOAP сервиса. Каждый метод (операция) имеет массив правил ```rules```. Свойство ```isActive: false | true``` определяет активно ли это праивло или нет. Каждое правило генерирует соотвествующий SOAP-response, необходимое для корректной работы сервиса. Правила со свойством ```isError: true``` имеют больший приориет по сравнению с отсальными правилами данного метода (операции).

Эмулятор не использует отдельной базы данных. В качестве источника данных используется файл ```db.json```. Чтобы получить срез данных используйте **GET** метод по адресу: ```{{url-root}}/get-json-database```.

Изменения в этом файле требуют рестарта сервера.Для замены файла ```user.conf.yml``` можно использовать **PUT** запрос по адресу ```{{url-root}}/yaml-config/user```.

Полное описание методов представлен в коллекции для Postman в файле ```res/FER_3.0.1.postman_collection.json```

По URL: ```/get-busy-slots``` доступен web-интерфейс для изменния статуса занятых слотов. Для отправки из МИС запросов ```UpdateAppointmentStatusRequest``` на сторону ЕПГУ. Для настройки адреса по приему запросов ```UpdateAppointmentStatusRequest``` на стороне федерации, используйте переменную окружения ```UPDATE_SERVICE_URL``` в файле ```server/Dockerfile```

## Приоритет файлов default.conf.yml и user.conf.yml
Файл ```default.conf.yml``` определяет настройки эмулятра по умолчанию. Чтобы изменить эти настройки нужно создать файл ```user.conf.yml``` (уже может быть создан в репозитории) и в нем указать:
```
name: 'user.conf.yml'
useDefaultYamlConfig: false
```
Если свойство ```useDefaultYamlConfig: false```, то настройки по умолчанию будут игнорироваться и поведение будет определяться файлом ```user.conf.yml```. Если свойство ```useDefaultYamlConfig: true```, то наоборот будут игнорироваться настройки ```user.conf.yml```.


