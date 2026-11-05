# 출조관제 HMI 모바일(PWA) 준비: PC 프로그램의 공용 게임 파일을 복사하고 앱 아이콘을 만듭니다.
# 사용: powershell -ExecutionPolicy Bypass -File mobile\build-mobile.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$www = Join-Path $here '..\SunsangHelper\wwwroot'
foreach ($f in 'game.js', 'games2.js', 'games3.js', 'games5.js', 'games6.js', 'story.js') { Copy-Item (Join-Path $www $f) $here -Force; "복사: $f" }

# 아이콘: 바다색 바탕 + 파도 + 닻 모양(글꼴 없이 도형으로)
Add-Type -AssemblyName System.Drawing
$icons = Join-Path $here 'icons'; New-Item -ItemType Directory -Force $icons | Out-Null
function Draw-Icon([int]$size, [string]$path, [double]$pad) {
    $b = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($b); $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#0B1A1F'))
    $s = $size * (1 - 2 * $pad); $o = $size * $pad
    $sea = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.PointF 0, ($o + $s * .55)), (New-Object System.Drawing.PointF 0, ($o + $s)), [System.Drawing.ColorTranslator]::FromHtml('#4FC0D0'), [System.Drawing.ColorTranslator]::FromHtml('#0F6A7A'))
    $g.FillRectangle($sea, $o, $o + $s * .6, $s, $s * .4)
    $sun = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#FF7A4A'))
    $g.FillEllipse($sun, $o + $s * .62, $o + $s * .14, $s * .22, $s * .22)
    $w = New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.Color]::White), ([single]($s * .045)); $w.StartCap = 'Round'; $w.EndCap = 'Round'
    $cx = $o + $s * .42; $top = $o + $s * .2
    $g.DrawEllipse($w, $cx - $s * .06, $top, $s * .12, $s * .12)                          # 고리
    $g.DrawLine($w, $cx, $top + $s * .12, $cx, $o + $s * .78)                              # 몸통
    $g.DrawLine($w, $cx - $s * .14, $top + $s * .22, $cx + $s * .14, $top + $s * .22)      # 가로대
    $g.DrawArc($w, $cx - $s * .22, $o + $s * .5, $s * .44, $s * .3, 20, 140)              # 갈고리
    $wave = New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.Color]::FromArgb(200, 255, 255, 255)), ([single]($s * .025))
    for ($i = 0; $i -lt 2; $i++) { $y = $o + $s * (.8 + $i * .09); $g.DrawBezier($wave, $o + $s * .08, $y, $o + $s * .3, $y - $s * .05, $o + $s * .5, $y + $s * .05, $o + $s * .92, $y) }
    $b.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $b.Dispose(); "아이콘: $(Split-Path -Leaf $path)"
}
Draw-Icon 192 (Join-Path $icons 'icon-192.png') 0.06
Draw-Icon 512 (Join-Path $icons 'icon-512.png') 0.06
Draw-Icon 512 (Join-Path $icons 'maskable-512.png') 0.16   # 안드로이드 둥근 아이콘용 여백
"완료 — mobile 폴더를 HTTPS 정적 호스팅에 올리면 설치형 앱이 됩니다 (README-mobile.md 참고)."
