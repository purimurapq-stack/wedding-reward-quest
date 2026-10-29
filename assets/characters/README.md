# 配置済みの原本PNG
- character_hanayome_01_black.png（500×600、RGBA透過）
- character_hanamuko_gray_black.png（500×615、RGBA透過）

ユーザーがGitHubへアップロードしたPNGをそのまま使用します。src/visuals.jsがHOME/STATUS/オープニングの共通参照先です。縦横比・pixelated・透過を維持し、結婚式だけCSSでジャンプします。画像が読み込めない場合のみラベルを表示。

差し替える場合は同名ファイルで置換するか、src/visuals.jsの相対パスを変更してください。ビルドで単体HTMLにもPNGを内蔵します。
