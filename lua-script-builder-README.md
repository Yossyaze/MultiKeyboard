# Lua Script Builder の使い方

1. lua-script-builder.html をブラウザで開く。
2. 基本キー設定で iPad/iPhone へ送るキーを入力する。
3. 操作ホットキー設定で「記録」を押し、各ホットキーを実際に押して登録する。
4. 待機時間とログ設定で秒数と「時系列ログ」の有効/無効を決める。
5. 実行フロー（時系列）パネルで 1 周の動作順と値を確認する。
6. スクリプト生成ボタンを押す。
7. コピーボタンまたは init.lua 保存ボタンを使う。
8. 生成結果を ~/.hammerspoon/init.lua に貼り付ける。
9. Hammerspoon で Reload Config を実行する。

## 時系列ログについて
- 生成Luaには、周回番号つきの時系列ログ関数が含まれます。
- ログ有効時は Hammerspoon Console に下記形式で表示されます。
- `HH:MM:SS.mmm | cycle=N | STEP_NAME | detail`
- 主なステップは `LOOP_START`, `CYCLE_BEGIN`, `IPAD_MOVE_SHORTCUT`, `IPAD_KEY_SEND`。
- 主なステップは `IPHONE_MOVE_SHORTCUT`, `IPHONE_KEY_SEND`, `CYCLE_END`, `LOOP_STOP`。
- 停止検知時は `STOP_DETECTED` が出力されます。

## 必要な事前設定
- Hammerspoon のアクセシビリティ権限を許可
- BetterTouchTool のトリガーを作成
- iPad Switch Control に iPadキーを割り当て
- Universal Control と iPhoneミラーリングが手動で動作することを確認

## メモ
- 停止が遅いと感じる場合は待機時間を短くする。
- 取りこぼしがある場合はフォーカス後待機を少し長くする。
