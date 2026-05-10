# =============================================================================
#  Normalize-PageHeaders.ps1
#  Unifica el "page header" / breadcrumb de todas las pantallas del módulo admin
#  para que tengan los mismos estilos, espaciado, tipografía y look & feel que
#  el de recepcion/list (recibo/listaordenrecibo), tomado como referencia.
#
#  ¿Qué normaliza?
#   1. Cambia el primer crumb "Warehouse" -> "TWH" para que sea consistente.
#   2. Asegura que el wrapper raíz tenga las clases `bg-gray-50`.
#   3. Asegura que el contenedor del header use el estilo blanco con sombra
#      (`bg-white shadow-sm` y `border-b border-gray-200`) en lugar de
#      variantes como `bg-card dark:bg-transparent`.
#   4. Asegura que los íconos chevron usen `text-gray-400`.
#   5. Asegura que el primer label del crumb (TWH) tenga `whitespace-nowrap
#      text-gray-700 hover:text-gray-900`.
#   6. Asegura que el `<h2>` del título tenga la misma jerarquía/colores.
#
#  ¿Qué NO toca?
#   - El TEXTO de los crumbs (cada pantalla mantiene los suyos).
#   - El TÍTULO de la pantalla.
#   - Bloques fuera del header.
#   - Componentes que no tengan el patrón reconocible (los lista al final).
#
#  Uso:
#   PS> ./Normalize-PageHeaders.ps1                  # DRY-RUN (default): muestra plan, no escribe.
#   PS> ./Normalize-PageHeaders.ps1 -Apply           # Aplica los cambios.
#   PS> ./Normalize-PageHeaders.ps1 -Apply -Verbose  # + detalle por archivo.
#   PS> ./Normalize-PageHeaders.ps1 -Root "src/app/modules/admin/reportes" -Apply
#
#  Antes de correr con -Apply: hacer commit de cambios pendientes para poder
#  revertir con `git checkout -- .` si algo se ve mal.
# =============================================================================

[CmdletBinding()]
param(
    [string]$Root = "",
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'

# Resolver el Root: 1) parametro explicito  2) script_dir/../src/...  3) cwd/src/...
if ([string]::IsNullOrWhiteSpace($Root)) {
    $base = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
    if ([string]::IsNullOrWhiteSpace($base)) { $base = (Get-Location).Path }
    $candidato = Join-Path $base "..\src\app\modules\admin"
    if (-not (Test-Path $candidato)) {
        $candidato = Join-Path (Get-Location).Path "src\app\modules\admin"
    }
    $Root = $candidato
}

if (-not (Test-Path $Root)) {
    Write-Error "No existe la carpeta raiz: $Root"
    exit 1
}

Write-Host ""
Write-Host "============================================================"
Write-Host "  Normalize-PageHeaders.ps1" -ForegroundColor Cyan
Write-Host "  Raíz : $((Resolve-Path $Root).Path)"
Write-Host "  Modo : $(if ($Apply) {'APLICAR cambios'} else {'DRY-RUN (no escribe)'})"
Write-Host "============================================================"
Write-Host ""

# Patrón canónico de identificación: pantallas que tienen el wrapper externo
# (con o sin bg-gray-50) y un comentario o el contenedor del header siguiente.
$archivos = Get-ChildItem -Path $Root -Recurse -Filter '*.component.html' -File

$cambiados = @()
$sinPatron = @()
$intactos  = @()

foreach ($f in $archivos) {
    $contenidoOriginal = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($contenidoOriginal)) { continue }

    $contenido = $contenidoOriginal

    # =========================================================================
    # PRE-PASO: convertir patron legacy <nav><ol><li> al patron canonico
    #   <div class="bg-white border-b border-gray-200 px-6 py-4">
    #     <h2 class="text-2xl font-semibold text-gray-800 mb-2">TITULO</h2>
    #     <nav aria-label="breadcrumb">
    #       <ol class="flex items-center space-x-2 text-sm">
    #         <li><a ...>CRUMB1</a></li>
    #         <li class="text-gray-400">/</li>
    #         <li class="text-gray-800 font-medium">CRUMB_FINAL</li>
    #       </ol>
    #     </nav>
    #   </div>
    # =========================================================================
    $regexLegacy = '(?s)<div class="bg-white border-b border-gray-200 px-6 py-4">\s*' +
                   '<h2 class="text-2xl font-semibold text-gray-800 mb-2">(?<titulo>.*?)</h2>\s*' +
                   '<nav aria-label="breadcrumb">\s*' +
                   '<ol class="flex items-center space-x-2 text-sm">\s*' +
                   '(?<lis>.*?)' +
                   '</ol>\s*' +
                   '</nav>\s*' +
                   '</div>'

    $contenido = [regex]::Replace($contenido, $regexLegacy, {
        param($m)
        $titulo = $m.Groups['titulo'].Value.Trim()
        $lisHtml = $m.Groups['lis'].Value

        # Extraer textos de los <li> que NO sean separadores (los que tienen "/")
        $liMatches = [regex]::Matches(
            $lisHtml,
            '<li[^>]*>\s*(?:<a[^>]*>\s*(?<txt>[^<]+?)\s*</a>|(?<txt>[^<]+?))\s*</li>',
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

        $crumbs = @()
        foreach ($lm in $liMatches) {
            $txt = $lm.Groups['txt'].Value.Trim()
            if ($txt -ne '/' -and -not [string]::IsNullOrWhiteSpace($txt)) {
                $crumbs += $txt
            }
        }

        # Anteponer "TWH" como primer crumb si aun no esta.
        if ($crumbs.Count -eq 0 -or $crumbs[0] -ne 'TWH') {
            $crumbs = @('TWH') + $crumbs
        }

        # Generar el HTML canonico
        $sb = New-Object System.Text.StringBuilder
        [void]$sb.AppendLine('<div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-4 sm:px-10 border-b border-gray-200 bg-white shadow-sm">')
        [void]$sb.AppendLine('    <div class="flex-1 min-w-0">')
        [void]$sb.AppendLine('      <div class="flex flex-wrap items-center font-medium text-sm text-gray-600">')
        for ($i = 0; $i -lt $crumbs.Count; $i++) {
            $cr = $crumbs[$i]
            if ($i -eq 0) {
                [void]$sb.AppendLine('        <div>')
                [void]$sb.AppendLine("          <a class=`"whitespace-nowrap text-gray-700 hover:text-gray-900`">$cr</a>")
                [void]$sb.AppendLine('        </div>')
            } else {
                [void]$sb.AppendLine('        <div class="flex items-center ml-1 whitespace-nowrap">')
                [void]$sb.AppendLine('          <mat-icon class="fuse-horizontal-navigation-item-icon text-gray-400" [svgIcon]="''heroicons_solid:chevron-right''"></mat-icon>')
                [void]$sb.AppendLine("          <a class=`"ml-1 text-gray-700 hover:text-gray-900`">$cr</a>")
                [void]$sb.AppendLine('        </div>')
            }
        }
        [void]$sb.AppendLine('      </div>')
        [void]$sb.AppendLine('      <div class="mt-1">')
        [void]$sb.AppendLine('        <h2 class="text-3xl md:text-4xl font-semibold tracking-tight leading-7 sm:leading-10 truncate text-gray-900">')
        [void]$sb.AppendLine("          $titulo")
        [void]$sb.AppendLine('        </h2>')
        [void]$sb.AppendLine('      </div>')
        [void]$sb.AppendLine('    </div>')
        [void]$sb.Append('  </div>')
        return $sb.ToString()
    })

    # ¿Tiene ahora el wrapper canonico (despues del pre-paso o desde el principio)?
    $tienePatron = $contenido -match 'flex\s+flex-col\s+sm:flex-row\s+flex-0\s+sm:items-center\s+sm:justify-between'
    if (-not $tienePatron) {
        $sinPatron += $f
        continue
    }

    # 1) Wrapper raíz: forzar `flex flex-col flex-auto min-w-0 bg-gray-50`
    #    (algunos archivos no incluyen `bg-gray-50`).
    $contenido = [regex]::Replace(
        $contenido,
        '<div class="flex flex-col flex-auto min-w-0(?<extra>[^"]*)">',
        {
            param($m)
            $extra = $m.Groups['extra'].Value
            if ($extra -notmatch 'bg-gray-50') { $extra = $extra.TrimEnd() + ' bg-gray-50' }
            "<div class=`"flex flex-col flex-auto min-w-0$extra`">"
        }
    )

    # 2) Header inner: normalizar a `bg-white shadow-sm` + borde estandar.
    #    Acepta variantes de padding (sm:py-4 o sm:py-8).
    $contenido = [regex]::Replace(
        $contenido,
        '<div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-(?:4|8) sm:px-10[^"]*">',
        '<div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-4 sm:px-10 border-b border-gray-200 bg-white shadow-sm">'
    )

    # 3) Primer crumb: "Warehouse" -> "TWH".
    $contenido = [regex]::Replace(
        $contenido,
        '(<a class="whitespace-nowrap text-gray-700 hover:text-gray-900">)\s*Warehouse\s*(</a>)',
        '${1}TWH${2}'
    )
    $contenido = [regex]::Replace(
        $contenido,
        '(<a[^>]*?class="[^"]*?">)\s*Warehouse\s*(</a>)',
        '${1}TWH${2}'
    )

    # 4) Chevron: asegurar `text-gray-400` (con o sin la clase).
    $contenido = [regex]::Replace(
        $contenido,
        '<mat-icon\s+class="fuse-horizontal-navigation-item-icon[^"]*?"\s*\[svgIcon\]="''heroicons_solid:chevron-right''"\s*>\s*</mat-icon>',
        '<mat-icon class="fuse-horizontal-navigation-item-icon text-gray-400" [svgIcon]="''heroicons_solid:chevron-right''"></mat-icon>',
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    # 5) Reemplazar text-primary-500 (estilo viejo) por gris canonico en <a> del breadcrumb.
    $contenido = [regex]::Replace(
        $contenido,
        '<a(\s+)class="(\s*whitespace-nowrap\s+)?text-primary-500"(\s*)>',
        '<a${1}class="whitespace-nowrap text-gray-700 hover:text-gray-900"${3}>'
    )
    $contenido = [regex]::Replace(
        $contenido,
        '<a(\s+)class="ml-1\s+text-primary-500"(\s*)>',
        '<a${1}class="ml-1 text-gray-700 hover:text-gray-900"${2}>'
    )

    # 6) Contenedor del breadcrumb: si solo tiene `font-medium` agregarle text-sm text-gray-600.
    $contenido = [regex]::Replace(
        $contenido,
        '<div\s+class="flex\s+flex-wrap\s+items-center\s+font-medium\s*">',
        '<div class="flex flex-wrap items-center font-medium text-sm text-gray-600">'
    )

    # 7) Primer crumb wrapper: forzar whitespace-nowrap.
    $contenido = [regex]::Replace(
        $contenido,
        '<a class="text-gray-700 hover:text-gray-900">\s*TWH\s*</a>',
        '<a class="whitespace-nowrap text-gray-700 hover:text-gray-900">TWH</a>'
    )

    # 8) <h2> del titulo: clases canonicas (acepta font-extrabold/font-semibold,
    #    con o sin text-gray-900).
    $contenido = [regex]::Replace(
        $contenido,
        '<h2\s+class="[^"]*?truncate[^"]*?">',
        '<h2 class="text-3xl md:text-4xl font-semibold tracking-tight leading-7 sm:leading-10 truncate text-gray-900">'
    )

    # 9) mt-2 -> mt-1 sobre el div padre del titulo.
    $contenido = $contenido -replace '<div class="mt-2"><h2', '<div class="mt-1"><h2'

    # 10) Anteponer "TWH" como primer crumb si no esta presente.
    #     Detecta el contenedor canonico de breadcrumb + primer <div><a>...</a></div>
    #     y, si el primer crumb NO dice "TWH", convierte el primer crumb actual
    #     en segundo crumb (con chevron) y antepone <div><a>TWH</a></div>.
    $contenido = [regex]::Replace(
        $contenido,
        '(?s)<div class="flex flex-wrap items-center font-medium text-sm text-gray-600">\s*<div>\s*(?<a><a[^>]*?>\s*(?<txt>[^<]+?)\s*</a>)\s*</div>',
        {
            param($m)
            $textoCrumb = $m.Groups['txt'].Value.Trim()
            if ($textoCrumb -match '^TWH$') {
                return $m.Value  # ya es TWH, no tocar
            }

            # Capturar [routerLink] si existe en el <a> original.
            $aOriginal = $m.Groups['a'].Value
            $rlMatch = [regex]::Match($aOriginal, '\[routerLink\]="([^"]+)"')
            $routerLinkAttr = if ($rlMatch.Success) { ' [routerLink]="' + $rlMatch.Groups[1].Value + '"' } else { '' }

            # Preservar `cursor-pointer` si lo tenia.
            $clases = 'ml-1 text-gray-700 hover:text-gray-900'
            if ($aOriginal -match 'cursor-pointer') { $clases += ' cursor-pointer' }

            $sb = New-Object System.Text.StringBuilder
            [void]$sb.AppendLine('<div class="flex flex-wrap items-center font-medium text-sm text-gray-600">')
            [void]$sb.AppendLine('        <div>')
            [void]$sb.AppendLine('          <a class="whitespace-nowrap text-gray-700 hover:text-gray-900">TWH</a>')
            [void]$sb.AppendLine('        </div>')
            [void]$sb.AppendLine('        <div class="flex items-center ml-1 whitespace-nowrap">')
            [void]$sb.AppendLine('          <mat-icon class="fuse-horizontal-navigation-item-icon text-gray-400" [svgIcon]="''heroicons_solid:chevron-right''"></mat-icon>')
            [void]$sb.AppendLine("          <a class=`"$clases`"$routerLinkAttr>$textoCrumb</a>")
            [void]$sb.Append('        </div>')
            return $sb.ToString()
        }
    )

    if ($contenido -ne $contenidoOriginal) {
        $cambiados += [pscustomobject]@{
            Archivo  = $f.FullName.Substring((Resolve-Path $Root).Path.Length).TrimStart('\','/')
            Bytes    = $contenido.Length - $contenidoOriginal.Length
        }

        if ($Apply) {
            # UTF-8 sin BOM para no romper diff
            [System.IO.File]::WriteAllText($f.FullName, $contenido, (New-Object System.Text.UTF8Encoding($false)))
        }
    } else {
        $intactos += $f
    }
}

# ----------- Reporte -----------
Write-Host ""
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "  Archivos analizados   : $($archivos.Count)"
Write-Host "  Con header normalizado: $($cambiados.Count)" -ForegroundColor Green
Write-Host "  Ya estaban OK         : $($intactos.Count)"
Write-Host "  Sin patrón reconocible: $($sinPatron.Count)" -ForegroundColor Yellow
Write-Host ""

if ($cambiados.Count -gt 0) {
    Write-Host "Archivos modificados$(if (-not $Apply) {' (dry-run, no escritos)'}):" -ForegroundColor Green
    $cambiados | Format-Table -AutoSize Archivo, @{Name='ΔBytes';Expression={$_.Bytes}}
}

if ($sinPatron.Count -gt 0 -and $VerbosePreference -eq 'Continue') {
    Write-Host "Sin patrón (revisar manualmente si tienen header):" -ForegroundColor Yellow
    $sinPatron | ForEach-Object {
        '   ' + $_.FullName.Substring((Resolve-Path $Root).Path.Length).TrimStart('\','/')
    }
}

if (-not $Apply) {
    Write-Host ""
    Write-Host "[i] DRY-RUN: re-ejecuta con -Apply para aplicar los cambios." -ForegroundColor Yellow
    Write-Host "    Recomendado: ejecuta 'git status' antes y 'git diff' despues para revisar." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Cambios aplicados." -ForegroundColor Green
    Write-Host "    Revisa con 'git diff' y compila con 'npm start' antes de commitear." -ForegroundColor Yellow
}
