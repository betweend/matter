# Matter Server (attestation opt-in)

Локальный Home Assistant add-on на базе Matter Server `1.4.0` (исходный
commit `83b79084c2c65ded92d9f5d61ab8d5417bf49699`). Dockerfile собирает сервер
из этого зафиксированного исходника и применяет лежащий рядом патч.

## Внимание: ослабление проверки подлинности

Параметр `allow_attestation_failure` по умолчанию выключен. При включении сервер
продолжает комиссионирование при **любых** findings Matter Device Attestation:
например, несовпадении VID в Certification Declaration и BasicInformation,
непроверенной цепочке сертификатов или тестовом сертификате. Каждый обход
пишется в журнал как WARNING вместе с типом и текстом findings. Это существенно
ослабляет проверку подлинности устройств; включайте параметр только для своих
устройств в доверенной сети и только если принимаете этот риск.

`enable_test_net_dcl` — отдельная штатная настройка для доверия тестовым DCL
сертификатам. Она не включает общий обход attestation и не исправляет
несовпадающий VID.

## Установка на Home Assistant OS

1. Сделайте резервную копию Home Assistant и Matter Server.
2. Скопируйте **всю** папку `matter_server_noattest` в `/addons/matter_server_noattest/`
   через Samba или SSH add-on. Dockerfile должен остаться в этой папке, а каталог
   `patches/` — рядом с ним.
3. В Home Assistant откройте **Settings → Add-ons → Add-on store → ⋮ → Check for
   updates → Local add-ons**, затем установите **Matter Server (attestation opt-in)**.
4. Остановите официальный **Matter Server** add-on перед запуском локального:
   оба используют host network и порт TCP 5580, поэтому одновременно работать
   они не могут.
5. Откройте настройки нового add-on. Оставьте
   `allow_attestation_failure: false` для обычного поведения. Для доверенного
   устройства, которое иначе не проходит проверку, явно включите его и сохраните.
6. Запустите локальный add-on. У Matter integration выберите найденный локальный
   Matter Server или обновите адрес WebSocket сервера на
   `ws://<IP-адрес-Home-Assistant>:5580/ws`. После смены add-on прежний URL
   `ws://core-matter-server:5580/ws` может указывать на остановленный сервер.
7. Запустите комиссионирование AC из Home Assistant. Используйте код из Apple
   Home **Turn On Pairing Mode** либо исходный QR-код `MT:KUAA0KOB00KA0648G00`.
   Не публикуйте pairing-коды: они позволяют добавить устройство в Matter fabric.
8. Проверьте журнал add-on: для каждого пропущенного attestation finding должна
   появиться запись WARNING с типом и описанием проблемы.

Сборка выполняется для `aarch64` и `amd64`. BLE адаптер, если он необходим,
доступен через `host_dbus`/`host_network`; настройки `ble_proxy` и
`bluetooth_adapter_id` сохранены.

### Хранилище и откат

Хранилище add-on привязано к его slug. Новый add-on начинает с отдельной базой,
fabric credentials и перечнем узлов; ранее commissioned устройства сами по
себе не появятся в новом сервере. Интеграция может показывать ошибку соединения,
пока не будет переключена на новый WebSocket URL. Не удаляйте старый add-on и его
данные, пока не проверите новый сервер.

Для переноса существующего fabric остановите оба add-on и восстановите в новом
add-on резервную копию **всего** каталога данных Matter Server, соблюдая
совместимость версий. Не запускайте два сервера с одной копией базы
одновременно. Если перенос не нужен, после проверки просто остановите новый
сервер, снова запустите официальный и верните интеграции прежний URL.

## Параметры

- `allow_attestation_failure` — общий обход отказов device attestation; default
  `false`.
- `enable_test_net_dcl` — доверие test-net DCL/OTA сертификатам; default `false`.
- `log_level`, `ble_proxy`, `bluetooth_adapter_id`,
  `default_fabric_label`, `matter_server_args` и `matter_server_env_vars`
  передаются Matter Server.
- `time_sync: on` включает синхронизацию Matter-устройств; `off` отключает.
  `auto` включает её, только если `timedatectl` подтверждает
  `NTPSynchronized=yes` на хосте. Если статус не удаётся получить, журнал
  содержит предупреждение, а синхронизация остаётся выключенной.

## Обновление pinned исходника

После публикации изменений в собственном fork можно заменить URL репозитория и
`MATTERJS_SERVER_COMMIT` в Dockerfile на полный commit SHA вашего fork. Сейчас
сборка намеренно использует upstream `v1.4.0` commit SHA и применяет локальный
патч, чтобы не ссылаться на несуществующий fork или неподтверждённый commit.
