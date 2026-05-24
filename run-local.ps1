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
                
                if ($user -eq "admin" -and $pass -eq "admin") {
                    $responseBody = '{"success": true}'
                    $response.StatusCode = 200
                    Write-Host " -> 200 OK (Auth Success)" -ForegroundColor Green
                } else {
                    $responseBody = '{"success": false, "message": "Invalid credentials. Use admin/admin."}'
                    $response.StatusCode = 401
                    Write-Host " -> 401 Unauthorized (Auth Failed)" -ForegroundColor Yellow
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
