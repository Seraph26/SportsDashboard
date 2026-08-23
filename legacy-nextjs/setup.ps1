mkdir app
mkdir app\team
mkdir app\team\id
mkdir components
mkdir lib
mkdir data
mkdir public

New-Item app\page.tsx -ItemType File
New-Item app\team\id\page.tsx -ItemType File

New-Item components\TeamCard.tsx -ItemType File
New-Item components\LiveTicker.tsx -ItemType File
New-Item components\ScheduleTable.tsx -ItemType File
New-Item components\CountdownTimer.tsx -ItemType File

New-Item lib\espnApi.ts -ItemType File
New-Item lib\storage.ts -ItemType File

New-Item data\teams.json -ItemType File
New-Item data\games.json -ItemType File
New-Item public\alert.mp3 -ItemType File