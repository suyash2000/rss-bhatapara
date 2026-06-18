$port = 8086
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   RSS BHATAPARA LOCAL DEV SERVER" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting server on http://localhost:$port/" -ForegroundColor Green
Write-Host "For Admin Login, use: admin / admin" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in this terminal to stop the server." -ForegroundColor Red
Write-Host "=========================================" -ForegroundColor Cyan

function Write-Response($response, $statusCode, $body, $contentType = "application/json; charset=utf-8") {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $response.StatusCode = $statusCode
    $response.ContentLength64 = $bytes.Length
    $response.ContentType = $contentType
    $response.AddHeader("Access-Control-Allow-Origin", "*")
    $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
    $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.Close()
}

try {
    $listener.Start()
    Start-Process "http://localhost:$port/"
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        Write-Host "$($request.HttpMethod) $($localPath)" -NoNewline
        
        # CORS Options handling
        if ($request.HttpMethod -eq "OPTIONS") {
            Write-Response $response 200 "{}"
            Write-Host " -> OPTIONS 200 OK" -ForegroundColor DarkGray
            continue
        }

        # Helper functions to read/write JSON files
        $getJson = {
            param($name)
            $path = Join-Path (Get-Location) "data\$name.json"
            if (Test-Path $path) {
                $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
                return @(ConvertFrom-Json $content)
            }
            return @()
        }
        $saveJson = {
            param($name, $obj)
            $path = Join-Path (Get-Location) "data\$name.json"
            $json = ConvertTo-Json $obj -Depth 100
            [System.IO.File]::WriteAllText($path, $json, [System.Text.Encoding]::UTF8)
        }

        # Netlify Functions & APIs
        if ($request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $bodyText = $reader.ReadToEnd()
            $reader.Close()
            $data = $null
            try { $data = ConvertFrom-Json $bodyText } catch {}

            # /.netlify/functions/login
            if ($localPath -eq "/.netlify/functions/login") {
                if ($data.username -eq "admin" -and $data.password -eq "admin") {
                    Write-Response $response 200 '{"success":true,"token":"local-dev-token-abc123xyz"}'
                    Write-Host " -> login: success" -ForegroundColor Green
                } else {
                    Write-Response $response 401 '{"success":false,"message":"Invalid credentials"}'
                    Write-Host " -> login: failed (401)" -ForegroundColor Yellow
                }
                continue
            }

            # /api/join
            if ($localPath -eq "/api/join") {
                $pending = &$getJson "pending"
                $maxId = 0
                foreach ($p in $pending) { if ($p.id -gt $maxId) { $maxId = $p.id } }
                
                $vyavsay = $data.vyavsay
                if ($data.spec_vyavsay) { $vyavsay = "$($data.vyavsay) ($($data.spec_vyavsay))" }
                
                $newRecord = [PSCustomObject]@{
                    id = $maxId + 1
                    name = $data.name
                    basti = $data.basti
                    area = $data.area
                    shakha = $data.shakha
                    role = $data.role
                    joining_year = $data.joining_year
                    contact = $data.contact
                    blood_group = $data.blood_group
                    vyavsay = $vyavsay
                    gannayak = $data.gannayak
                    ganvesh = $data.ganvesh
                }
                
                if ($data.isAdmin -eq $true) {
                    $volunteers = &$getJson "volunteers"
                    $maxVolId = 0
                    foreach ($v in $volunteers) { if ($v.id -gt $maxVolId) { $maxVolId = $v.id } }
                    $newRecord.id = $maxVolId + 1
                    $volunteers += $newRecord
                    &$saveJson "volunteers" $volunteers
                    Write-Response $response 200 '{"success":true}'
                    Write-Host " -> join (admin): success" -ForegroundColor Green
                } else {
                    $pending += $newRecord
                    &$saveJson "pending" $pending
                    Write-Response $response 200 '{"success":true}'
                    Write-Host " -> join: success" -ForegroundColor Green
                }
                continue
            }

            # /api/edit-volunteer
            if ($localPath -eq "/api/edit-volunteer") {
                $volunteers = &$getJson "volunteers"
                $updated = @()
                foreach ($v in $volunteers) {
                    if ($v.id -eq $data.id) {
                        $v.name = $data.name
                        $v.contact = $data.contact
                        $v.shakha = $data.shakha
                        $v.role = $data.role
                        $v.basti = $data.basti
                        $v.area = $data.area
                        $v.blood_group = $data.blood_group
                        $v.vyavsay = $data.vyavsay
                        $v.joining_year = $data.joining_year
                        $v.ganvesh = $data.ganvesh
                        $v.gannayak = $data.gannayak
                    }
                    $updated += $v
                }
                &$saveJson "volunteers" $updated
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> edit-volunteer: success" -ForegroundColor Green
                continue
            }

            # /api/edit-pending-volunteer
            if ($localPath -eq "/api/edit-pending-volunteer") {
                $pending = &$getJson "pending"
                $updated = @()
                foreach ($v in $pending) {
                    if ($v.id -eq $data.id) {
                        $v.name = $data.name
                        $v.contact = $data.contact
                        $v.shakha = $data.shakha
                        $v.role = $data.role
                        $v.basti = $data.basti
                        $v.area = $data.area
                        $v.blood_group = $data.blood_group
                        $v.vyavsay = $data.vyavsay
                        $v.joining_year = $data.joining_year
                        $v.ganvesh = $data.ganvesh
                        $v.gannayak = $data.gannayak
                    }
                    $updated += $v
                }
                &$saveJson "pending" $updated
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> edit-pending: success" -ForegroundColor Green
                continue
            }

            # /api/approve-volunteer
            if ($localPath -eq "/api/approve-volunteer") {
                $pending = &$getJson "pending"
                $volunteers = &$getJson "volunteers"
                
                $match = $null
                $remainingPending = @()
                foreach ($p in $pending) {
                    if ($p.id -eq $data.id) {
                        $match = $p
                    } else {
                        $remainingPending += $p
                    }
                }
                
                if ($match) {
                    $maxVolId = 0
                    foreach ($v in $volunteers) { if ($v.id -gt $maxVolId) { $maxVolId = $v.id } }
                    $match.id = $maxVolId + 1
                    $volunteers += $match
                    &$saveJson "volunteers" $volunteers
                    &$saveJson "pending" $remainingPending
                    Write-Response $response 200 '{"success":true}'
                    Write-Host " -> approve-volunteer: success" -ForegroundColor Green
                } else {
                    Write-Response $response 400 '{"success":false,"message":"Pending record not found"}'
                    Write-Host " -> approve-volunteer: failed (400)" -ForegroundColor Red
                }
                continue
            }

            # /api/reject-volunteer
            if ($localPath -eq "/api/reject-volunteer") {
                $pending = &$getJson "pending"
                $remaining = @()
                foreach ($p in $pending) {
                    if ($p.id -ne $data.id) { $remaining += $p }
                }
                &$saveJson "pending" $remaining
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> reject-volunteer: success" -ForegroundColor Green
                continue
            }

            # /api/delete-volunteer
            if ($localPath -eq "/api/delete-volunteer") {
                $volunteers = &$getJson "volunteers"
                $remaining = @()
                foreach ($v in $volunteers) {
                    if ($v.id -ne $data.id) { $remaining += $v }
                }
                &$saveJson "volunteers" $remaining
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> delete-volunteer: success" -ForegroundColor Green
                continue
            }

            # /api/event-add
            if ($localPath -eq "/api/event-add") {
                $events = &$getJson "events"
                $maxId = 0
                foreach ($e in $events) { if ($e.id -gt $maxId) { $maxId = $e.id } }
                
                $newEvent = [PSCustomObject]@{
                    id = $maxId + 1
                    title = $data.title
                    date = $data.date
                    time = $data.time
                    location = $data.location
                    type = $data.type
                    description = $data.description
                    status = $data.status
                }
                $events += $newEvent
                &$saveJson "events" $events
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> event-add: success" -ForegroundColor Green
                continue
            }

            # /api/event-edit
            if ($localPath -eq "/api/event-edit") {
                $events = &$getJson "events"
                $updated = @()
                foreach ($e in $events) {
                    if ($e.id -eq $data.id) {
                        $e.title = $data.title
                        $e.date = $data.date
                        $e.time = $data.time
                        $e.location = $data.location
                        $e.type = $data.type
                        $e.description = $data.description
                        $e.status = $data.status
                    }
                    $updated += $e
                }
                &$saveJson "events" $updated
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> event-edit: success" -ForegroundColor Green
                continue
            }

            # /api/event-delete
            if ($localPath -eq "/api/event-delete") {
                $events = &$getJson "events"
                $remaining = @()
                foreach ($e in $events) {
                    if ($e.id -ne $data.id) { $remaining += $e }
                }
                &$saveJson "events" $remaining
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> event-delete: success" -ForegroundColor Green
                continue
            }

            # /api/varg-add
            if ($localPath -eq "/api/varg-add") {
                $varg = &$getJson "varg"
                $newEntry = [PSCustomObject]@{
                    name = $data.name
                    mobile = $data.mobile
                    session = $data.session
                    sthal = $data.sthal
                }
                $varg[$data.vargIdx] += $newEntry
                &$saveJson "varg" $varg
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> varg-add: success" -ForegroundColor Green
                continue
            }

            # /api/varg-edit
            if ($localPath -eq "/api/varg-edit") {
                $varg = &$getJson "varg"
                $subArray = $varg[$data.vargIdx]
                $entry = $subArray[$data.entryIdx]
                $entry.name = $data.name
                $entry.mobile = $data.mobile
                $entry.session = $data.session
                $entry.sthal = $data.sthal
                &$saveJson "varg" $varg
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> varg-edit: success" -ForegroundColor Green
                continue
            }

            # /api/varg-delete
            if ($localPath -eq "/api/varg-delete") {
                $varg = &$getJson "varg"
                $subArray = $varg[$data.vargIdx]
                $newSubArray = @()
                for ($idx = 0; $idx -lt $subArray.Count; $idx++) {
                    if ($idx -ne $data.entryIdx) {
                        $newSubArray += $subArray[$idx]
                    }
                }
                $varg[$data.vargIdx] = $newSubArray
                &$saveJson "varg" $varg
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> varg-delete: success" -ForegroundColor Green
                continue
            }

            # /api/gannayak-add
            if ($localPath -eq "/api/gannayak-add") {
                $gannayaks = &$getJson "gannayaks"
                $nameStr = [string]$data.name
                if ($gannayaks -notcontains $nameStr) {
                    $gannayaks += $nameStr
                }
                &$saveJson "gannayaks" $gannayaks
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> gannayak-add: success" -ForegroundColor Green
                continue
            }

            # /api/gannayak-edit
            if ($localPath -eq "/api/gannayak-edit") {
                $gannayaks = &$getJson "gannayaks"
                $idx = [int]$data.index
                $nameStr = [string]$data.name
                $newGannayaks = @()
                for ($i = 0; $i -lt $gannayaks.Count; $i++) {
                    if ($i -eq $idx) {
                        $newGannayaks += $nameStr
                    } else {
                        $newGannayaks += $gannayaks[$i]
                    }
                }
                &$saveJson "gannayaks" $newGannayaks
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> gannayak-edit: success" -ForegroundColor Green
                continue
            }

            # /api/gannayak-delete
            if ($localPath -eq "/api/gannayak-delete") {
                $gannayaks = &$getJson "gannayaks"
                $idx = [int]$data.index
                $newGannayaks = @()
                for ($i = 0; $i -lt $gannayaks.Count; $i++) {
                    if ($i -ne $idx) {
                        $newGannayaks += $gannayaks[$i]
                    }
                }
                &$saveJson "gannayaks" $newGannayaks
                Write-Response $response 200 '{"success":true}'
                Write-Host " -> gannayak-delete: success" -ForegroundColor Green
                continue
            }
        }

        # Static File Serving (HTML, CSS, JS, JSON, etc.)
        $relPath = $localPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($relPath)) { $relPath = "index.html" }
        $filePath = Join-Path (Get-Location) $relPath
        
        if (Test-Path $filePath -PathType Container) {
            $filePath = Join-Path $filePath "index.html"
        }
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath)
            
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".ico"  { "image/x-icon" }
                ".csv"  { "text/csv; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $response.Close()
            Write-Host " -> 200 OK" -ForegroundColor Green
        } else {
            $errorMessage = "404 Not Found: $localPath"
            Write-Response $response 404 $errorMessage "text/plain; charset=utf-8"
            Write-Host " -> 404 Not Found" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
} finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Yellow
}
