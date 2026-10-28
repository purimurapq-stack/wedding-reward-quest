# 静止PNGの保存先
以下の添付画像を受領後、このディレクトリに保存します。
- character_hanayome_01_black.png（新婦）
- character_hanamuko_gray_black.png（新郎）

チャット内の添付画像は視認できていますが、元PNGがツール用のファイルとして提供されていないため、リポジトリ内は未配置です。設定画面から端末上の元PNGを選択すると、そのまま全画面へ適用できます。生成ドット絵の代用はしていません。読み込み失敗時だけラベルを表示します。

src/visuals.js のcharacterAssetsで一括設定します。すべての表示に同じPNGを使用し、縦横比を保つobject-fit:containとimage-rendering:pixelatedを適用。単体HTML生成時には配置済み画像を自動でdata URL化します。
