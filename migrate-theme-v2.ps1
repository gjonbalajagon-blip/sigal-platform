$ErrorActionPreference = "Stop"

$labels = @{
    'dashboard.html'  = 'Dashboard'
    'oferta.html'     = 'Oferta'
    'kontratat.html'  = 'Kontratat'
    'faturimi.html'   = 'Faturimi'
    'rinovimet.html'  = 'Rinovimet'
    'debitoret.html'  = 'Debitoret'
    'raportet.html'   = 'Raportet'
    'stafi.html'      = 'Stafi'
}

$pages = @(
    'pages/dashboard.html',
    'pages/oferta.html',
    'pages/oferta-view.html',
    'pages/faturimi.html',
    'pages/rinovimet.html',
    'pages/debitoret.html',
    'pages/stafi.html'
)

function Migrate-Page {
    param([string]$path)

    if (-not (Test-Path $path)) {
        Write-Host "  [SKIP] $path nuk ekziston" -ForegroundColor Yellow
        return
    }

    Write-Host ""
    Write-Host ">>> $path" -ForegroundColor Cyan
    $content = Get-Content $path -Raw -Encoding UTF8

    $backup = "$path.bak"
    Set-Content $backup $content -Encoding UTF8 -NoNewline
    Write-Host "  [BACKUP] $backup" -ForegroundColor DarkGray

    $original = $content

    if ($content -match 'href="\.\./css/theme\.css"') {
        $content = $content -replace 'href="\.\./css/theme\.css"', 'href="../css/theme-v2.css"'
        Write-Host "  [OK] CSS link -> theme-v2.css" -ForegroundColor Green
    } elseif ($content -match 'href="\.\./css/theme-v2\.css"') {
        Write-Host "  [--] CSS tashme theme-v2.css" -ForegroundColor DarkGray
    } else {
        Write-Host "  [!!] Nuk u gjet link i theme.css" -ForegroundColor Yellow
    }

    $added = 0
    foreach ($href in $labels.Keys) {
        $lbl = $labels[$href]
        $pattern = '(<a\s+href="' + [regex]::Escape($href) + '"\s+class="nav-item[^"]*")(?![^>]*data-label)'
        $replacement = '$1 data-label="' + $lbl + '"'
        $new = [regex]::Replace($content, $pattern, $replacement)
        if ($new -ne $content) {
            $content = $new
            $added++
        }
    }
    if ($added -gt 0) {
        Write-Host "  [OK] data-label shtuar ne $added nav-items" -ForegroundColor Green
    } else {
        Write-Host "  [--] data-label tashme ekzistojne" -ForegroundColor DarkGray
    }

    $topbarPattern = '<div\s+class="topbar"\s+style="[^"]*"'
    if ($content -match $topbarPattern) {
        $content = $content -replace $topbarPattern, '<div class="topbar"'
        Write-Host "  [OK] Hequr style inline nga .topbar" -ForegroundColor Green
    }

    if ($content -ne $original) {
        Set-Content $path $content -Encoding UTF8 -NoNewline
        Write-Host "  [SAVED] $path" -ForegroundColor Green
    } else {
        Write-Host "  [NO CHANGE]" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Magenta
Write-Host "  SIGAL Theme v2 Migration" -ForegroundColor Magenta
Write-Host "===========================================" -ForegroundColor Magenta

foreach ($p in $pages) {
    Migrate-Page -path $p
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Magenta
Write-Host "  Perfundoi!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Magenta