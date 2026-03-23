Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$script:CanvasWidth = 440
$script:CanvasHeight = 180
$script:OutputDirectory = Join-Path $PSScriptRoot "../src/assets/notation"
$script:InkColor = [System.Drawing.Color]::FromArgb(255, 255, 248, 238)

New-Item -ItemType Directory -Path $script:OutputDirectory -Force | Out-Null

function New-Surface {
  $bitmap = New-Object System.Drawing.Bitmap $script:CanvasWidth, $script:CanvasHeight
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  return @{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function New-InkBrush {
  return New-Object System.Drawing.SolidBrush $script:InkColor
}

function New-InkPen([float]$width) {
  $pen = New-Object System.Drawing.Pen $script:InkColor, $width
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  return $pen
}

function Draw-NoteHead {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Brush]$Brush,
    [float]$CenterX,
    [float]$CenterY,
    [float]$Width = 38,
    [float]$Height = 28,
    [float]$Angle = -24
  )

  $state = $Graphics.Save()
  $Graphics.TranslateTransform($CenterX, $CenterY)
  $Graphics.RotateTransform($Angle)
  $Graphics.FillEllipse($Brush, -($Width / 2), -($Height / 2), $Width, $Height)
  $Graphics.Restore($state)
}

function Draw-Stem {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [float]$X,
    [float]$BottomY,
    [float]$TopY
  )

  $Graphics.DrawLine($Pen, $X, $BottomY, $X, $TopY)
}

function Draw-Beam {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Brush]$Brush,
    [float]$LeftX,
    [float]$RightX,
    [float]$TopY,
    [float]$Slope,
    [float]$Thickness
  )

  $points = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($LeftX, $TopY),
    [System.Drawing.PointF]::new($RightX, $TopY + $Slope),
    [System.Drawing.PointF]::new($RightX, $TopY + $Slope + $Thickness),
    [System.Drawing.PointF]::new($LeftX, $TopY + $Thickness)
  )

  $Graphics.FillPolygon($Brush, $points)
}

function Get-BeamBottomY {
  param(
    [float]$X,
    [float]$LeftX,
    [float]$RightX,
    [float]$TopY,
    [float]$Slope,
    [float]$Thickness
  )

  if ([Math]::Abs($RightX - $LeftX) -lt 0.0001) {
    return $TopY + $Thickness
  }

  $progress = ($X - $LeftX) / ($RightX - $LeftX)
  return $TopY + ($Slope * $progress) + $Thickness
}

function Draw-EighthRest {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Brush]$Brush,
    [System.Drawing.Pen]$Pen,
    [float]$X,
    [float]$Y,
    [float]$Scale = 1
  )

  $Graphics.FillEllipse($Brush, $X + (2 * $Scale), $Y - (30 * $Scale), 11 * $Scale, 11 * $Scale)
  $Graphics.DrawBezier(
    $Pen,
    [System.Drawing.PointF]::new($X + (12 * $Scale), $Y - (18 * $Scale)),
    [System.Drawing.PointF]::new($X + (22 * $Scale), $Y - (10 * $Scale)),
    [System.Drawing.PointF]::new($X - (6 * $Scale), $Y + (4 * $Scale)),
    [System.Drawing.PointF]::new($X - (10 * $Scale), $Y + (18 * $Scale))
  )
  $Graphics.DrawBezier(
    $Pen,
    [System.Drawing.PointF]::new($X - (10 * $Scale), $Y + (18 * $Scale)),
    [System.Drawing.PointF]::new($X - (4 * $Scale), $Y + (20 * $Scale)),
    [System.Drawing.PointF]::new($X + (14 * $Scale), $Y + (18 * $Scale)),
    [System.Drawing.PointF]::new($X + (6 * $Scale), $Y + (30 * $Scale))
  )
}

function Draw-SixteenthRest {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Brush]$Brush,
    [System.Drawing.Pen]$Pen,
    [float]$X,
    [float]$Y,
    [float]$Scale = 1
  )

  Draw-EighthRest -Graphics $Graphics -Brush $Brush -Pen $Pen -X $X -Y $Y -Scale $Scale
  $Graphics.FillEllipse($Brush, $X - (4 * $Scale), $Y - (10 * $Scale), 9 * $Scale, 9 * $Scale)
  $Graphics.DrawBezier(
    $Pen,
    [System.Drawing.PointF]::new($X, $Y - (2 * $Scale)),
    [System.Drawing.PointF]::new($X + (14 * $Scale), $Y + (6 * $Scale)),
    [System.Drawing.PointF]::new($X - (2 * $Scale), $Y + (16 * $Scale)),
    [System.Drawing.PointF]::new($X - (10 * $Scale), $Y + (26 * $Scale))
  )
}

function Draw-TupletBracket {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [float]$LeftX,
    [float]$RightX,
    [float]$Y
  )

  $font = New-Object System.Drawing.Font("Segoe UI", 28, ([System.Drawing.FontStyle]::Bold), [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-InkBrush
  $label = "3"
  $labelSize = $Graphics.MeasureString($label, $font)
  $gap = 20
  $centerX = ($LeftX + $RightX) / 2
  $labelLeft = $centerX - ($labelSize.Width / 2)
  $labelRight = $centerX + ($labelSize.Width / 2)

  try {
    $Graphics.DrawLine($Pen, $LeftX, $Y + 8, $LeftX, $Y)
    $Graphics.DrawLine($Pen, $LeftX, $Y, $labelLeft - $gap, $Y)
    $Graphics.DrawLine($Pen, $labelRight + $gap, $Y, $RightX, $Y)
    $Graphics.DrawLine($Pen, $RightX, $Y, $RightX, $Y + 8)
    $Graphics.DrawString($label, $font, $brush, $labelLeft, $Y - 20)
  }
  finally {
    $brush.Dispose()
    $font.Dispose()
  }
}

function Draw-Quarter {
  param([System.Drawing.Graphics]$Graphics)

  $brush = New-InkBrush
  $pen = New-InkPen 8

  try {
    Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX 198 -CenterY 114
    Draw-Stem -Graphics $Graphics -Pen $pen -X 214 -BottomY 108 -TopY 34
  }
  finally {
    $pen.Dispose()
    $brush.Dispose()
  }
}

function Draw-EighthPair {
  param([System.Drawing.Graphics]$Graphics)

  $brush = New-InkBrush
  $pen = New-InkPen 7
  $leftX = 146
  $rightX = 294
  $beamLeft = $leftX + 14
  $beamRight = $rightX + 14
  $beamTop = 48
  $beamSlope = -5
  $beamThickness = 13

  try {
    Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX $leftX -CenterY 118
    Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX $rightX -CenterY 114
    Draw-Beam -Graphics $Graphics -Brush $brush -LeftX $beamLeft -RightX $beamRight -TopY $beamTop -Slope $beamSlope -Thickness $beamThickness

    Draw-Stem -Graphics $Graphics -Pen $pen -X $beamLeft -BottomY 111 -TopY (Get-BeamBottomY -X $beamLeft -LeftX $beamLeft -RightX $beamRight -TopY $beamTop -Slope $beamSlope -Thickness $beamThickness)
    Draw-Stem -Graphics $Graphics -Pen $pen -X $beamRight -BottomY 107 -TopY (Get-BeamBottomY -X $beamRight -LeftX $beamLeft -RightX $beamRight -TopY $beamTop -Slope $beamSlope -Thickness $beamThickness)
  }
  finally {
    $pen.Dispose()
    $brush.Dispose()
  }
}

function Draw-Triplet {
  param(
    [System.Drawing.Graphics]$Graphics,
    [bool]$WithRest
  )

  $brush = New-InkBrush
  $pen = New-InkPen 7
  $leftX = 96
  $middleX = 220
  $rightX = 344
  $beamLeft = $leftX + 14
  $beamRight = $rightX + 14
  $beamTop = 58
  $beamSlope = -4
  $beamThickness = 11

  try {
    Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX $leftX -CenterY 120
    Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX $rightX -CenterY 116
    Draw-Stem -Graphics $Graphics -Pen $pen -X $beamLeft -BottomY 112 -TopY (Get-BeamBottomY -X $beamLeft -LeftX $beamLeft -RightX $beamRight -TopY $beamTop -Slope $beamSlope -Thickness $beamThickness)
    Draw-Stem -Graphics $Graphics -Pen $pen -X $beamRight -BottomY 108 -TopY (Get-BeamBottomY -X $beamRight -LeftX $beamLeft -RightX $beamRight -TopY $beamTop -Slope $beamSlope -Thickness $beamThickness)

    if ($WithRest) {
      Draw-EighthRest -Graphics $Graphics -Brush $brush -Pen $pen -X ($middleX - 6) -Y 98 -Scale 1.1
      Draw-Stem -Graphics $Graphics -Pen $pen -X ($middleX + 12) -BottomY 98 -TopY (Get-BeamBottomY -X ($middleX + 12) -LeftX $beamLeft -RightX $beamRight -TopY $beamTop -Slope $beamSlope -Thickness $beamThickness)
    }
    else {
      $middleStemX = $middleX + 14
      Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX $middleX -CenterY 118
      Draw-Stem -Graphics $Graphics -Pen $pen -X $middleStemX -BottomY 110 -TopY (Get-BeamBottomY -X $middleStemX -LeftX $beamLeft -RightX $beamRight -TopY $beamTop -Slope $beamSlope -Thickness $beamThickness)
    }

    Draw-Beam -Graphics $Graphics -Brush $brush -LeftX $beamLeft -RightX $beamRight -TopY $beamTop -Slope $beamSlope -Thickness $beamThickness

    $bracketPen = New-InkPen 3.4

    try {
      Draw-TupletBracket -Graphics $Graphics -Pen $bracketPen -LeftX 84 -RightX 358 -Y 28
    }
    finally {
      $bracketPen.Dispose()
    }
  }
  finally {
    $pen.Dispose()
    $brush.Dispose()
  }
}

function Draw-SixteenthGroup {
  param(
    [System.Drawing.Graphics]$Graphics,
    [bool]$WithRests
  )

  $brush = New-InkBrush
  $pen = New-InkPen 6.5
  $slotXs = @(76, 166, 256, 346)
  $stemXs = $slotXs | ForEach-Object { $_ + 14 }
  $beamLeft = $stemXs[0]
  $beamRight = $stemXs[3]
  $beamTop1 = 56
  $beamTop2 = 72
  $beamSlope = -4
  $beamThickness = 9

  try {
    Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX $slotXs[0] -CenterY 122
    Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX $slotXs[3] -CenterY 116

    if ($WithRests) {
      Draw-SixteenthRest -Graphics $Graphics -Brush $brush -Pen $pen -X ($slotXs[1] - 2) -Y 100 -Scale 1
      Draw-SixteenthRest -Graphics $Graphics -Brush $brush -Pen $pen -X ($slotXs[2] - 2) -Y 98 -Scale 1
      Draw-Stem -Graphics $Graphics -Pen $pen -X $stemXs[1] -BottomY 96 -TopY (Get-BeamBottomY -X $stemXs[1] -LeftX $beamLeft -RightX $beamRight -TopY $beamTop2 -Slope $beamSlope -Thickness $beamThickness)
      Draw-Stem -Graphics $Graphics -Pen $pen -X $stemXs[2] -BottomY 94 -TopY (Get-BeamBottomY -X $stemXs[2] -LeftX $beamLeft -RightX $beamRight -TopY $beamTop2 -Slope $beamSlope -Thickness $beamThickness)
    }
    else {
      Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX $slotXs[1] -CenterY 120
      Draw-NoteHead -Graphics $Graphics -Brush $brush -CenterX $slotXs[2] -CenterY 118
    }

    foreach ($stemX in @($stemXs[0], $stemXs[3])) {
      $bottomY = if ($stemX -eq $stemXs[0]) { 114 } else { 108 }
      Draw-Stem -Graphics $Graphics -Pen $pen -X $stemX -BottomY $bottomY -TopY (Get-BeamBottomY -X $stemX -LeftX $beamLeft -RightX $beamRight -TopY $beamTop2 -Slope $beamSlope -Thickness $beamThickness)
    }

    if (-not $WithRests) {
      foreach ($index in 1..2) {
        Draw-Stem -Graphics $Graphics -Pen $pen -X $stemXs[$index] -BottomY (110 - ($index * 2)) -TopY (Get-BeamBottomY -X $stemXs[$index] -LeftX $beamLeft -RightX $beamRight -TopY $beamTop2 -Slope $beamSlope -Thickness $beamThickness)
      }
    }

    Draw-Beam -Graphics $Graphics -Brush $brush -LeftX $beamLeft -RightX $beamRight -TopY $beamTop1 -Slope $beamSlope -Thickness $beamThickness
    Draw-Beam -Graphics $Graphics -Brush $brush -LeftX $beamLeft -RightX $beamRight -TopY $beamTop2 -Slope $beamSlope -Thickness $beamThickness
  }
  finally {
    $pen.Dispose()
    $brush.Dispose()
  }
}

function Save-NotationPng {
  param(
    [string]$Name,
    [scriptblock]$Draw
  )

  $surface = New-Surface

  try {
    & $Draw $surface.Graphics
    $outputPath = Join-Path $script:OutputDirectory "$Name.png"
    $surface.Bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated $outputPath"
  }
  finally {
    $surface.Graphics.Dispose()
    $surface.Bitmap.Dispose()
  }
}

Save-NotationPng -Name "quarter" -Draw { param($graphics) Draw-Quarter -Graphics $graphics }
Save-NotationPng -Name "eighth" -Draw { param($graphics) Draw-EighthPair -Graphics $graphics }
Save-NotationPng -Name "eighth-triplet" -Draw { param($graphics) Draw-Triplet -Graphics $graphics -WithRest:$false }
Save-NotationPng -Name "eighth-triplet-rest" -Draw { param($graphics) Draw-Triplet -Graphics $graphics -WithRest:$true }
Save-NotationPng -Name "sixteenth" -Draw { param($graphics) Draw-SixteenthGroup -Graphics $graphics -WithRests:$false }
Save-NotationPng -Name "sixteenth-rest" -Draw { param($graphics) Draw-SixteenthGroup -Graphics $graphics -WithRests:$true }
