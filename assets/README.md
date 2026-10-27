素材差し替え先。現状は src/app.js の sprite() と landscape() がインラインSVG/CSS素材を提供します。sprite() を assets/groom.svg / bride.svg の img 要素へ変更すると差し替えできます。画像には役割を示すaltを付け、2コマの場合はCSS steps()を使ってください。
