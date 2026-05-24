$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   RSS BHATAPARA LOCAL DEV SERVER" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting server on http://localhost:$port/" -ForegroundColor Green
Write-Host "For Admin Login, use: admin / admin" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in this terminal to stop the server." -ForegroundColor Red
Write-Host "=========================================" -ForegroundColor Cyan

try {
    $listener.Start()
    # Auto-open browser
    Start-Process "http://localhost:$port/"
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        
        # Log request
        Write-Host "$($request.HttpMethod) $($localPath)" -NoNewline
        
        if ($request.HttpMethod -eq "POST" -and $localPath -eq "/.netlify/functions/login") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $loginData = ConvertFrom-Json $body
                $user = $loginData.username
                $pass = $loginData.password
                
                # In local dev server, accept any credentials for ease of testing,
                # or verify that they are not empty.
                if ($user -and $pass) {
                    $responseBody = '{"success": true}'
                    $response.StatusCode = 200
                    Write-Host " -> 200 OK (Auth Success: '$user')" -ForegroundColor Green
                } else {
                    $responseBody = '{"success": false, "message": "Username and password cannot be empty."}'
                    $response.StatusCode = 401
                    Write-Host " -> 401 Unauthorized (Empty Credentials)" -ForegroundColor Yellow
                }
            } catch {
                $responseBody = '{"success": false, "message": "Bad request"}'
                $response.StatusCode = 400
                Write-Host " -> 400 Bad Request" -ForegroundColor Red
            }
            
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
            $response.ContentLength64 = $bytes.Length
            $response.ContentType = "application/json; charset=utf-8"
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } elseif ($request.HttpMethod -eq "POST" -and $localPath -eq "/api/join") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $data = ConvertFrom-Json $body
                
                $name = $data.name
                $basti = $data.basti
                $area = $data.area
                $shakha = $data.shakha
                $role = $data.role
                $blood_group = $data.blood_group
                $vyavsay = $data.vyavsay
                $spec_vyavsay = $data.spec_vyavsay
                $ganvesh = $data.ganvesh
                $gannayak = $data.gannayak
                $joining_year = $data.joining_year
                $contact = $data.contact
                $isAdmin = $data.isAdmin
                
                # Format specific occupation detail
                $vyavsayField = $vyavsay
                if ($spec_vyavsay) {
                    $vyavsayField = "$vyavsay ($spec_vyavsay)"
                }
                
                $sharedJsPath = Join-Path (Get-Location) "js\shared.js"
                
                if ($isAdmin -eq $true) {
                    # 1. Update CSV file
                    $csvPath = Join-Path (Get-Location) "data\volunteers.csv"
                    $csvLine = "$name,$basti,$area,$shakha,$role,$joining_year,$contact,$blood_group,$vyavsayField,$gannayak,$ganvesh"
                    [System.IO.File]::AppendAllText($csvPath, "`n" + $csvLine, [System.Text.Encoding]::UTF8)
                    Write-Host " -> Added '$name' to volunteers.csv" -ForegroundColor Yellow
                    
                    # 2. Update shared.js database array
                    if (Test-Path $sharedJsPath) {
                        $jsContent = [System.IO.File]::ReadAllText($sharedJsPath, [System.Text.Encoding]::UTF8)
                        $volunteersBlock = $jsContent
                        if ($jsContent -match 'const VOLUNTEERS_DATA = \[(?s)(.*?)\];') {
                            $volunteersBlock = $Matches[1]
                        }
                        
                        $matches = [regex]::Matches($volunteersBlock, 'id:\s*(\d+)')
                        $nextId = 16
                        if ($matches.Count -gt 0) {
                            $ids = @()
                            foreach ($m in $matches) {
                                $ids += [int]$m.Groups[1].Value
                            }
                            $maxId = ($ids | Measure-Object -Maximum).Maximum
                            $nextId = $maxId + 1
                        }
                        
                        $jsLine = "  { id:$nextId,  name:'$name',      basti:'$basti',          area:'$area',             shakha:'$shakha',   role:'$role',    joining_year:'$joining_year', contact:'$contact', blood_group:'$blood_group',  vyavsay:'$vyavsayField', gannayak:'$gannayak', ganvesh:'$ganvesh' },"
                        
                        $lines = [System.IO.File]::ReadAllLines($sharedJsPath, [System.Text.Encoding]::UTF8)
                        $insertIndex = -1
                        $foundBlock = $false
                        for ($i = 0; $i -lt $lines.Length; $i++) {
                            if ($lines[$i].Contains("const VOLUNTEERS_DATA = [")) {
                                $foundBlock = $true
                            }
                            if ($foundBlock -and $lines[$i].Trim() -eq "];") {
                                $insertIndex = $i
                                break
                            }
                        }
                        
                        if ($insertIndex -ne -1) {
                            $newLines = $lines[0..($insertIndex-1)] + $jsLine + $lines[$insertIndex..($lines.Length-1)]
                            [System.IO.File]::WriteAllLines($sharedJsPath, $newLines, [System.Text.Encoding]::UTF8)
                            Write-Host " -> Added '$name' to shared.js (ID: $nextId)" -ForegroundColor Yellow
                        }
                    }
                } else {
                    # 1. Update pending_volunteers.csv file
                    $pendingCsvPath = Join-Path (Get-Location) "data\pending_volunteers.csv"
                    $csvLine = "$name,$basti,$area,$shakha,$role,$joining_year,$contact,$blood_group,$vyavsayField,$gannayak,$ganvesh"
                    [System.IO.File]::AppendAllText($pendingCsvPath, "`n" + $csvLine, [System.Text.Encoding]::UTF8)
                    Write-Host " -> Added '$name' to pending_volunteers.csv" -ForegroundColor Yellow
                    
                    # 2. Update shared.js database array
                    if (Test-Path $sharedJsPath) {
                        $jsContent = [System.IO.File]::ReadAllText($sharedJsPath, [System.Text.Encoding]::UTF8)
                        $pendingBlock = $jsContent
                        if ($jsContent -match 'const PENDING_VOLUNTEERS_DATA = \[(?s)(.*?)\];') {
                            $pendingBlock = $Matches[1]
                        }
                        
                        $matches = [regex]::Matches($pendingBlock, 'id:\s*(\d+)')
                        $nextId = 1
                        if ($matches.Count -gt 0) {
                            $ids = @()
                            foreach ($m in $matches) {
                                $ids += [int]$m.Groups[1].Value
                            }
                            $maxId = ($ids | Measure-Object -Maximum).Maximum
                            $nextId = $maxId + 1
                        }
                        
                        $jsLine = "  { id:$nextId,  name:'$name',      basti:'$basti',          area:'$area',             shakha:'$shakha',   role:'$role',    joining_year:'$joining_year', contact:'$contact', blood_group:'$blood_group',  vyavsay:'$vyavsayField', gannayak:'$gannayak', ganvesh:'$ganvesh' },"
                        
                        $lines = [System.IO.File]::ReadAllLines($sharedJsPath, [System.Text.Encoding]::UTF8)
                        $insertIndex = -1
                        $foundBlock = $false
                        for ($i = 0; $i -lt $lines.Length; $i++) {
                            if ($lines[$i].Contains("const PENDING_VOLUNTEERS_DATA = [")) {
                                $foundBlock = $true
                            }
                            if ($foundBlock -and $lines[$i].Trim() -eq "];") {
                                $insertIndex = $i
                                break
                            }
                        }
                        
                        if ($insertIndex -ne -1) {
                            $newLines = $lines[0..($insertIndex-1)] + $jsLine + $lines[$insertIndex..($lines.Length-1)]
                            [System.IO.File]::WriteAllLines($sharedJsPath, $newLines, [System.Text.Encoding]::UTF8)
                            Write-Host " -> Added '$name' to pending in shared.js (ID: $nextId)" -ForegroundColor Yellow
                        }
                    }
                }
                
                $responseBody = '{"success": true}'
                $response.StatusCode = 200
                Write-Host " -> 200 OK (Registration Saved)" -ForegroundColor Green
            } catch {
                $responseBody = '{"success": false, "message": "Bad request"}'
                $response.StatusCode = 400
                Write-Host " -> 400 Bad Request: $_" -ForegroundColor Red
            }
            
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
            $response.ContentLength64 = $bytes.Length
            $response.ContentType = "application/json; charset=utf-8"
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } elseif ($request.HttpMethod -eq "POST" -and $localPath -eq "/api/edit-volunteer") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $data = ConvertFrom-Json $body
                
                $id = [int]$data.id
                $name = $data.name
                $basti = $data.basti
                $area = $data.area
                $shakha = $data.shakha
                $role = $data.role
                $blood_group = $data.blood_group
                $vyavsay = $data.vyavsay
                $ganvesh = $data.ganvesh
                $gannayak = $data.gannayak
                $joining_year = $data.joining_year
                $contact = $data.contact
                
                # 1. Update shared.js database array by modifying the line of that volunteer ID
                $sharedJsPath = Join-Path (Get-Location) "js\shared.js"
                if (Test-Path $sharedJsPath) {
                    $lines = [System.IO.File]::ReadAllLines($sharedJsPath, [System.Text.Encoding]::UTF8)
                    $updated = $false
                    for ($i = 0; $i -lt $lines.Length; $i++) {
                        if ($lines[$i] -match "\bid:\s*$id\b") {
                            $lines[$i] = "  { id:$id,  name:'$name',      basti:'$basti',          area:'$area',             shakha:'$shakha',   role:'$role',    joining_year:'$joining_year', contact:'$contact', blood_group:'$blood_group',  vyavsay:'$vyavsay', gannayak:'$gannayak', ganvesh:'$ganvesh' },"
                            $updated = $true
                            break
                        }
                    }
                    if ($updated) {
                        [System.IO.File]::WriteAllLines($sharedJsPath, $lines, [System.Text.Encoding]::UTF8)
                        Write-Host " -> Updated '$name' (ID: $id) in shared.js" -ForegroundColor Yellow
                    }
                }
                
                # 2. Sync volunteers.csv from the updated shared.js data to keep them in perfect lockstep
                $csvPath = Join-Path (Get-Location) "data\volunteers.csv"
                if (Test-Path $sharedJsPath) {
                    $jsContent = [System.IO.File]::ReadAllText($sharedJsPath, [System.Text.Encoding]::UTF8)
                    $volunteersBlock = $jsContent
                    if ($jsContent -match 'const VOLUNTEERS_DATA = \[(?s)(.*?)\];') {
                        $volunteersBlock = $Matches[1]
                    }
                    $matches = [regex]::Matches($volunteersBlock, '(?s)\{\s*id:\s*(?<id>\d+),\s*name:\s*''(?<name>.*?)'',\s*basti:\s*''(?<basti>.*?)'',\s*area:\s*''(?<area>.*?)'',\s*shakha:\s*''(?<shakha>.*?)'',\s*role:\s*''(?<role>.*?)'',\s*joining_year:\s*''(?<year>.*?)'',\s*contact:\s*''(?<contact>.*?)'',\s*blood_group:\s*''(?<blood>.*?)'',\s*vyavsay:\s*''(?<vyavsay>.*?)'',\s*gannayak:\s*''(?<gannayak>.*?)'',\s*ganvesh:\s*''(?<ganvesh>.*?)''\s*\}')
                    
                    $csvLines = @("name,basti,area,shakha,role,joining_year,contact,blood_group,vyavsay,gannayak,ganvesh")
                    foreach ($m in $matches) {
                        $csvLines += "$($m.Groups['name'].Value),$($m.Groups['basti'].Value),$($m.Groups['area'].Value),$($m.Groups['shakha'].Value),$($m.Groups['role'].Value),$($m.Groups['year'].Value),$($m.Groups['contact'].Value),$($m.Groups['blood'].Value),$($m.Groups['vyavsay'].Value),$($m.Groups['gannayak'].Value),$($m.Groups['ganvesh'].Value)"
                    }
                    [System.IO.File]::WriteAllLines($csvPath, $csvLines, [System.Text.Encoding]::UTF8)
                    Write-Host " -> Synced and updated volunteers.csv" -ForegroundColor Yellow
                }
                
                $responseBody = '{"success": true}'
                $response.StatusCode = 200
                Write-Host " -> 200 OK (Edit Saved)" -ForegroundColor Green
            } catch {
                $responseBody = '{"success": false, "message": "Bad request"}'
                $response.StatusCode = 400
                Write-Host " -> 400 Bad Request: $_" -ForegroundColor Red
            }
            
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
            $response.ContentLength64 = $bytes.Length
            $response.ContentType = "application/json; charset=utf-8"
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } elseif ($request.HttpMethod -eq "POST" -and $localPath -eq "/api/approve-volunteer") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $data = ConvertFrom-Json $body
                $id = [int]$data.id
                
                $sharedJsPath = Join-Path (Get-Location) "js\shared.js"
                $csvPath = Join-Path (Get-Location) "data\volunteers.csv"
                $pendingCsvPath = Join-Path (Get-Location) "data\pending_volunteers.csv"
                
                if (Test-Path $sharedJsPath) {
                    $lines = [System.IO.File]::ReadAllLines($sharedJsPath, [System.Text.Encoding]::UTF8)
                    $pendingIdRegex = "\bid:\s*$id\b"
                    
                    # 1. Locate and remove from PENDING_VOLUNTEERS_DATA, while capturing its contents
                    $foundLineIndex = -1
                    $foundLine = ""
                    $insidePending = $false
                    for ($i = 0; $i -lt $lines.Length; $i++) {
                        if ($lines[$i].Contains("const PENDING_VOLUNTEERS_DATA = [")) {
                            $insidePending = $true
                        }
                        if ($insidePending -and $lines[$i] -match $pendingIdRegex) {
                            $foundLineIndex = $i
                            $foundLine = $lines[$i]
                        }
                        if ($insidePending -and $lines[$i].Trim() -eq "];") {
                            $insidePending = $false
                        }
                    }
                    
                    if ($foundLineIndex -ne -1) {
                        # Extract details using regex
                        $pattern = "name:\s*'(?<name>.*?)',\s*basti:\s*'(?<basti>.*?)',\s*area:\s*'(?<area>.*?)',\s*shakha:\s*'(?<shakha>.*?)',\s*role:\s*'(?<role>.*?)',\s*joining_year:\s*'(?<year>.*?)',\s*contact:\s*'(?<contact>.*?)',\s*blood_group:\s*'(?<blood>.*?)',\s*vyavsay:\s*'(?<vyavsay>.*?)',\s*gannayak:\s*'(?<gannayak>.*?)',\s*ganvesh:\s*'(?<ganvesh>.*?)'"
                        
                        if ($foundLine -match $pattern) {
                            $name = $Matches['name']
                            $basti = $Matches['basti']
                            $area = $Matches['area']
                            $shakha = $Matches['shakha']
                            $role = $Matches['role']
                            $joining_year = $Matches['year']
                            $contact = $Matches['contact']
                            $blood_group = $Matches['blood']
                            $vyavsayField = $Matches['vyavsay']
                            $gannayak = $Matches['gannayak']
                            $ganvesh = $Matches['ganvesh']
                            
                            # Remove the pending line from lines
                            $newLines = @()
                            for ($i = 0; $i -lt $lines.Length; $i++) {
                                if ($i -eq $foundLineIndex) {
                                    continue
                                }
                                $newLines += $lines[$i]
                            }
                            
                            # Find maximum ID in VOLUNTEERS_DATA
                            $jsContent = [System.IO.File]::ReadAllText($sharedJsPath, [System.Text.Encoding]::UTF8)
                            $volunteersBlock = $jsContent
                            if ($jsContent -match 'const VOLUNTEERS_DATA = \[(?s)(.*?)\];') {
                                $volunteersBlock = $Matches[1]
                            }
                            $volMatches = [regex]::Matches($volunteersBlock, 'id:\s*(\d+)')
                            $nextActiveId = 16
                            if ($volMatches.Count -gt 0) {
                                $ids = @()
                                foreach ($m in $volMatches) {
                                    $ids += [int]$m.Groups[1].Value
                                }
                                $maxId = ($ids | Measure-Object -Maximum).Maximum
                                $nextActiveId = $maxId + 1
                            }
                            
                            # Construct new active line
                            $jsLine = "  { id:$nextActiveId,  name:'$name',      basti:'$basti',          area:'$area',             shakha:'$shakha',   role:'$role',    joining_year:'$joining_year', contact:'$contact', blood_group:'$blood_group',  vyavsay:'$vyavsayField', gannayak:'$gannayak', ganvesh:'$ganvesh' },"
                            
                            # Locate closing bracket of VOLUNTEERS_DATA
                            $insertIndex = -1
                            $foundBlock = $false
                            for ($i = 0; $i -lt $newLines.Length; $i++) {
                                if ($newLines[$i].Contains("const VOLUNTEERS_DATA = [")) {
                                    $foundBlock = $true
                                }
                                if ($foundBlock -and $newLines[$i].Trim() -eq "];") {
                                    $insertIndex = $i
                                    break
                                }
                            }
                            
                            if ($insertIndex -ne -1) {
                                $finalLines = $newLines[0..($insertIndex-1)] + $jsLine + $newLines[$insertIndex..($newLines.Length-1)]
                                [System.IO.File]::WriteAllLines($sharedJsPath, $finalLines, [System.Text.Encoding]::UTF8)
                                Write-Host " -> Approved and moved '$name' (ID: $nextActiveId) to VOLUNTEERS_DATA" -ForegroundColor Yellow
                                
                                # Re-sync CSV files
                                $finalContent = [System.IO.File]::ReadAllText($sharedJsPath, [System.Text.Encoding]::UTF8)
                                
                                # Re-sync volunteers.csv
                                if ($finalContent -match 'const VOLUNTEERS_DATA = \[(?s)(.*?)\];') {
                                    $block = $Matches[1]
                                    $itemMatches = [regex]::Matches($block, '(?s)\{\s*id:\s*(?<id>\d+),\s*name:\s*''(?<name>.*?)'',\s*basti:\s*''(?<basti>.*?)'',\s*area:\s*''(?<area>.*?)'',\s*shakha:\s*''(?<shakha>.*?)'',\s*role:\s*''(?<role>.*?)'',\s*joining_year:\s*''(?<year>.*?)'',\s*contact:\s*''(?<contact>.*?)'',\s*blood_group:\s*''(?<blood>.*?)'',\s*vyavsay:\s*''(?<vyavsay>.*?)'',\s*gannayak:\s*''(?<gannayak>.*?)'',\s*ganvesh:\s*''(?<ganvesh>.*?)''\s*\}')
                                    $csvLines = @("name,basti,area,shakha,role,joining_year,contact,blood_group,vyavsay,gannayak,ganvesh")
                                    foreach ($m in $itemMatches) {
                                        $csvLines += "$($m.Groups['name'].Value),$($m.Groups['basti'].Value),$($m.Groups['area'].Value),$($m.Groups['shakha'].Value),$($m.Groups['role'].Value),$($m.Groups['year'].Value),$($m.Groups['contact'].Value),$($m.Groups['blood'].Value),$($m.Groups['vyavsay'].Value),$($m.Groups['gannayak'].Value),$($m.Groups['ganvesh'].Value)"
                                    }
                                    [System.IO.File]::WriteAllLines($csvPath, $csvLines, [System.Text.Encoding]::UTF8)
                                }
                                
                                # Re-sync pending_volunteers.csv
                                if ($finalContent -match 'const PENDING_VOLUNTEERS_DATA = \[(?s)(.*?)\];') {
                                    $block = $Matches[1]
                                    $itemMatches = [regex]::Matches($block, '(?s)\{\s*id:\s*(?<id>\d+),\s*name:\s*''(?<name>.*?)'',\s*basti:\s*''(?<basti>.*?)'',\s*area:\s*''(?<area>.*?)'',\s*shakha:\s*''(?<shakha>.*?)'',\s*role:\s*''(?<role>.*?)'',\s*joining_year:\s*''(?<year>.*?)'',\s*contact:\s*''(?<contact>.*?)'',\s*blood_group:\s*''(?<blood>.*?)'',\s*vyavsay:\s*''(?<vyavsay>.*?)'',\s*gannayak:\s*''(?<gannayak>.*?)'',\s*ganvesh:\s*''(?<ganvesh>.*?)''\s*\}')
                                    $csvLines = @("name,basti,area,shakha,role,joining_year,contact,blood_group,vyavsay,gannayak,ganvesh")
                                    foreach ($m in $itemMatches) {
                                        $csvLines += "$($m.Groups['name'].Value),$($m.Groups['basti'].Value),$($m.Groups['area'].Value),$($m.Groups['shakha'].Value),$($m.Groups['role'].Value),$($m.Groups['year'].Value),$($m.Groups['contact'].Value),$($m.Groups['blood'].Value),$($m.Groups['vyavsay'].Value),$($m.Groups['gannayak'].Value),$($m.Groups['ganvesh'].Value)"
                                    }
                                    [System.IO.File]::WriteAllLines($pendingCsvPath, $csvLines, [System.Text.Encoding]::UTF8)
                                }
                            }
                        }
                    }
                }
                
                $responseBody = '{"success": true}'
                $response.StatusCode = 200
                Write-Host " -> 200 OK (Volunteer Approved)" -ForegroundColor Green
            } catch {
                $responseBody = '{"success": false, "message": "Bad request"}'
                $response.StatusCode = 400
                Write-Host " -> 400 Bad Request: $_" -ForegroundColor Red
            }
            
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
            $response.ContentLength64 = $bytes.Length
            $response.ContentType = "application/json; charset=utf-8"
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } elseif ($request.HttpMethod -eq "POST" -and $localPath -eq "/api/reject-volunteer") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $data = ConvertFrom-Json $body
                $id = [int]$data.id
                
                $sharedJsPath = Join-Path (Get-Location) "js\shared.js"
                $pendingCsvPath = Join-Path (Get-Location) "data\pending_volunteers.csv"
                
                if (Test-Path $sharedJsPath) {
                    $lines = [System.IO.File]::ReadAllLines($sharedJsPath, [System.Text.Encoding]::UTF8)
                    $pendingIdRegex = "\bid:\s*$id\b"
                    
                    # Locate and remove from PENDING_VOLUNTEERS_DATA
                    $foundLineIndex = -1
                    $insidePending = $false
                    for ($i = 0; $i -lt $lines.Length; $i++) {
                        if ($lines[$i].Contains("const PENDING_VOLUNTEERS_DATA = [")) {
                            $insidePending = $true
                        }
                        if ($insidePending -and $lines[$i] -match $pendingIdRegex) {
                            $foundLineIndex = $i
                        }
                        if ($insidePending -and $lines[$i].Trim() -eq "];") {
                            $insidePending = $false
                        }
                    }
                    
                    if ($foundLineIndex -ne -1) {
                        $newLines = @()
                        for ($i = 0; $i -lt $lines.Length; $i++) {
                            if ($i -eq $foundLineIndex) {
                                continue
                            }
                            $newLines += $lines[$i]
                        }
                        [System.IO.File]::WriteAllLines($sharedJsPath, $newLines, [System.Text.Encoding]::UTF8)
                        Write-Host " -> Rejected and removed pending volunteer ID $id" -ForegroundColor Yellow
                        
                        # Re-sync pending_volunteers.csv
                        $finalContent = [System.IO.File]::ReadAllText($sharedJsPath, [System.Text.Encoding]::UTF8)
                        if ($finalContent -match 'const PENDING_VOLUNTEERS_DATA = \[(?s)(.*?)\];') {
                            $block = $Matches[1]
                            $itemMatches = [regex]::Matches($block, '(?s)\{\s*id:\s*(?<id>\d+),\s*name:\s*''(?<name>.*?)'',\s*basti:\s*''(?<basti>.*?)'',\s*area:\s*''(?<area>.*?)'',\s*shakha:\s*''(?<shakha>.*?)'',\s*role:\s*''(?<role>.*?)'',\s*joining_year:\s*''(?<year>.*?)'',\s*contact:\s*''(?<contact>.*?)'',\s*blood_group:\s*''(?<blood>.*?)'',\s*vyavsay:\s*''(?<vyavsay>.*?)'',\s*gannayak:\s*''(?<gannayak>.*?)'',\s*ganvesh:\s*''(?<ganvesh>.*?)''\s*\}')
                            $csvLines = @("name,basti,area,shakha,role,joining_year,contact,blood_group,vyavsay,gannayak,ganvesh")
                            foreach ($m in $itemMatches) {
                                $csvLines += "$($m.Groups['name'].Value),$($m.Groups['basti'].Value),$($m.Groups['area'].Value),$($m.Groups['shakha'].Value),$($m.Groups['role'].Value),$($m.Groups['year'].Value),$($m.Groups['contact'].Value),$($m.Groups['blood'].Value),$($m.Groups['vyavsay'].Value),$($m.Groups['gannayak'].Value),$($m.Groups['ganvesh'].Value)"
                            }
                            [System.IO.File]::WriteAllLines($pendingCsvPath, $csvLines, [System.Text.Encoding]::UTF8)
                        }
                    }
                }
                
                $responseBody = '{"success": true}'
                $response.StatusCode = 200
                Write-Host " -> 200 OK (Volunteer Rejected)" -ForegroundColor Green
            } catch {
                $responseBody = '{"success": false, "message": "Bad request"}'
                $response.StatusCode = 400
                Write-Host " -> 400 Bad Request: $_" -ForegroundColor Red
            }
            
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
            $response.ContentLength64 = $bytes.Length
            $response.ContentType = "application/json; charset=utf-8"
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } elseif ($request.HttpMethod -eq "POST" -and $localPath -eq "/api/edit-pending-volunteer") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $data = ConvertFrom-Json $body
                
                $id = [int]$data.id
                $name = $data.name
                $basti = $data.basti
                $area = $data.area
                $shakha = $data.shakha
                $role = $data.role
                $blood_group = $data.blood_group
                $vyavsay = $data.vyavsay
                $ganvesh = $data.ganvesh
                $gannayak = $data.gannayak
                $joining_year = $data.joining_year
                $contact = $data.contact
                
                # 1. Update shared.js database array in the PENDING_VOLUNTEERS_DATA block
                $sharedJsPath = Join-Path (Get-Location) "js\shared.js"
                if (Test-Path $sharedJsPath) {
                    $lines = [System.IO.File]::ReadAllLines($sharedJsPath, [System.Text.Encoding]::UTF8)
                    $updated = $false
                    
                    # Search within PENDING_VOLUNTEERS_DATA block
                    $insidePending = $false
                    for ($i = 0; $i -lt $lines.Length; $i++) {
                        if ($lines[$i].Contains("const PENDING_VOLUNTEERS_DATA = [")) {
                            $insidePending = $true
                        }
                        if ($insidePending -and $lines[$i] -match "\bid:\s*$id\b") {
                            $lines[$i] = "  { id:$id,  name:'$name',      basti:'$basti',          area:'$area',             shakha:'$shakha',   role:'$role',    joining_year:'$joining_year', contact:'$contact', blood_group:'$blood_group',  vyavsay:'$vyavsay', gannayak:'$gannayak', ganvesh:'$ganvesh' },"
                            $updated = $true
                            break
                        }
                        if ($insidePending -and $lines[$i].Trim() -eq "];") {
                            $insidePending = $false
                        }
                    }
                    
                    if ($updated) {
                        [System.IO.File]::WriteAllLines($sharedJsPath, $lines, [System.Text.Encoding]::UTF8)
                        Write-Host " -> Updated pending volunteer '$name' (ID: $id) in shared.js" -ForegroundColor Yellow
                    }
                }
                
                # 2. Sync pending_volunteers.csv
                $pendingCsvPath = Join-Path (Get-Location) "data\pending_volunteers.csv"
                if (Test-Path $sharedJsPath) {
                    $jsContent = [System.IO.File]::ReadAllText($sharedJsPath, [System.Text.Encoding]::UTF8)
                    $pendingBlock = $jsContent
                    if ($jsContent -match 'const PENDING_VOLUNTEERS_DATA = \[(?s)(.*?)\];') {
                        $pendingBlock = $Matches[1]
                    }
                    $matches = [regex]::Matches($pendingBlock, '(?s)\{\s*id:\s*(?<id>\d+),\s*name:\s*''(?<name>.*?)'',\s*basti:\s*''(?<basti>.*?)'',\s*area:\s*''(?<area>.*?)'',\s*shakha:\s*''(?<shakha>.*?)'',\s*role:\s*''(?<role>.*?)'',\s*joining_year:\s*''(?<year>.*?)'',\s*contact:\s*''(?<contact>.*?)'',\s*blood_group:\s*''(?<blood>.*?)'',\s*vyavsay:\s*''(?<vyavsay>.*?)'',\s*gannayak:\s*''(?<gannayak>.*?)'',\s*ganvesh:\s*''(?<ganvesh>.*?)''\s*\}')
                    
                    $csvLines = @("name,basti,area,shakha,role,joining_year,contact,blood_group,vyavsay,gannayak,ganvesh")
                    foreach ($m in $matches) {
                        $csvLines += "$($m.Groups['name'].Value),$($m.Groups['basti'].Value),$($m.Groups['area'].Value),$($m.Groups['shakha'].Value),$($m.Groups['role'].Value),$($m.Groups['year'].Value),$($m.Groups['contact'].Value),$($m.Groups['blood'].Value),$($m.Groups['vyavsay'].Value),$($m.Groups['gannayak'].Value),$($m.Groups['ganvesh'].Value)"
                    }
                    [System.IO.File]::WriteAllLines($pendingCsvPath, $csvLines, [System.Text.Encoding]::UTF8)
                    Write-Host " -> Synced and updated pending_volunteers.csv" -ForegroundColor Yellow
                }
                
                $responseBody = '{"success": true}'
                $response.StatusCode = 200
                Write-Host " -> 200 OK (Pending Edit Saved)" -ForegroundColor Green
            } catch {
                $responseBody = '{"success": false, "message": "Bad request"}'
                $response.StatusCode = 400
                Write-Host " -> 400 Bad Request: $_" -ForegroundColor Red
            }
            
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
            $response.ContentLength64 = $bytes.Length
            $response.ContentType = "application/json; charset=utf-8"
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            # Static files
            $relPath = $localPath.TrimStart('/')
            if ([string]::IsNullOrEmpty($relPath)) { $relPath = "index.html" }
            $filePath = Join-Path (Get-Location) $relPath
            
            if (Test-Path $filePath -PathType Container) {
                $filePath = Join-Path $filePath "index.html"
            }
            
            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                
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
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host " -> 200 OK" -ForegroundColor Green
            } else {
                $response.StatusCode = 404
                $errorMessage = "File not found: $localPath"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
                $response.ContentLength64 = $bytes.Length
                $response.ContentType = "text/plain; charset=utf-8"
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host " -> 404 Not Found" -ForegroundColor Red
            }
        }
        $response.Close()
    }
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
} finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Yellow
}
