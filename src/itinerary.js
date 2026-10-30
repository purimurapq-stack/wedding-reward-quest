// 実旅行の初期計画。時刻・移動区間はこのファイルで編集できます。
export const itineraryDefaults={
  "hotel": "グランドメルキュール八ヶ岳リゾート＆スパ",
  "actions": [
    {
      "id": "a1-0",
      "day": 1,
      "time": "10:00",
      "safeText": "10時くらいに家を出る",
      "detail": "10時くらいに家を出る",
      "questId": "q1-0",
      "note": "時刻は目安",
      "safeNote": "時刻は目安",
      "revealTime": "10:00",
      "needsVerification": false
    },
    {
      "id": "a1-1",
      "day": 1,
      "time": "10:24",
      "safeText": "大口駅から横浜線に乗車",
      "detail": "大口駅を出発（横浜線・八王子方面）",
      "questId": "q1-0",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "10:24",
      "needsVerification": true
    },
    {
      "id": "a1-2",
      "day": 1,
      "time": "11:30",
      "safeText": "特急列車に乗り換え",
      "detail": "八王子駅から特急あずさに乗車",
      "questId": "q1-0",
      "note": "11:30頃・往路指定席購入済み",
      "safeNote": "仮予定・要確認",
      "revealTime": "11:30",
      "needsVerification": true
    },
    {
      "id": "a1-3",
      "day": 1,
      "time": "13:37",
      "safeText": "乗り換え駅に到着",
      "detail": "小淵沢駅に到着",
      "questId": "q1-0",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "13:37",
      "needsVerification": true
    },
    {
      "id": "a1-4",
      "day": 1,
      "time": "13:52",
      "safeText": "列車に乗車",
      "detail": "小淵沢駅から小海線に乗車",
      "questId": "q1-0",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "13:52",
      "needsVerification": true
    },
    {
      "id": "a1-5",
      "day": 1,
      "time": "14:07",
      "safeText": "目的地の駅に到着",
      "detail": "甲斐大泉駅に到着",
      "questId": "q1-0",
      "note": "14:07頃・要確認",
      "safeNote": "仮予定・要確認",
      "revealTime": "14:07",
      "needsVerification": true
    },
    {
      "id": "a1-6",
      "day": 1,
      "time": "14:15",
      "safeText": "駅からホテル送迎バスに乗車",
      "detail": "甲斐大泉駅からホテル送迎バスに乗車",
      "questId": "q1-0",
      "note": "時刻・乗車場所は要確認",
      "safeNote": "仮予定・要確認",
      "revealTime": "14:15",
      "needsVerification": true
    },
    {
      "id": "a1-7",
      "day": 1,
      "time": "15:00",
      "safeText": "ひみつのホテルにチェックイン",
      "detail": "グランドメルキュール八ヶ岳リゾート＆スパにチェックイン",
      "questId": "q1-1",
      "note": "15:00頃",
      "safeNote": "仮予定・要確認",
      "revealTime": "15:00",
      "needsVerification": true
    },
    {
      "id": "a1-8",
      "day": 1,
      "time": "17:00",
      "safeText": "ホテルで休憩",
      "detail": "ホテルのラウンジで休憩",
      "questId": "q1-2",
      "note": "夕方以降・時刻は目安",
      "safeNote": "仮予定・要確認",
      "revealTime": "17:00",
      "needsVerification": true
    },
    {
      "id": "a1-9",
      "day": 1,
      "time": "19:00",
      "safeText": "ホテルで夕食・入浴",
      "detail": "ホテルで夕食・温泉",
      "questId": "q1-2",
      "note": "夕方以降・時刻は目安",
      "safeNote": "仮予定・要確認",
      "revealTime": "19:00",
      "needsVerification": true
    },
    {
      "id": "a2-0",
      "day": 2,
      "time": "10:09",
      "safeText": "清里ピクニックバスに乗車（大泉周遊ルート）",
      "detail": "ホテル付近から清里駅へ（清里ピクニックバス・大泉周遊ルート）",
      "questId": "q2-0",
      "note": "10:09発→10:25着",
      "safeNote": "仮予定・要確認",
      "revealTime": "10:25",
      "needsVerification": true
    },
    {
      "id": "a2-1",
      "day": 2,
      "time": "10:25",
      "safeText": "駅に到着・バスを乗り換え",
      "detail": "清里駅に到着・北部周遊ルートへ乗り換え",
      "questId": "q2-0",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "10:25",
      "needsVerification": true
    },
    {
      "id": "a2-2",
      "day": 2,
      "time": "10:50",
      "safeText": "清里ピクニックバスに乗車（北部周遊ルート）",
      "detail": "清里駅からサンメドウズ清里へ（清里ピクニックバス・北部周遊ルート）",
      "questId": "q2-0",
      "note": "10:50発→11:04着",
      "safeNote": "仮予定・要確認",
      "revealTime": "11:04",
      "needsVerification": true
    },
    {
      "id": "a2-3",
      "day": 2,
      "time": "11:04",
      "safeText": "ひみつの目的地に到着",
      "detail": "サンメドウズ清里に到着",
      "questId": "q2-0",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "11:04",
      "needsVerification": true
    },
    {
      "id": "a2-4",
      "day": 2,
      "time": "11:10",
      "safeText": "リフト・絶景・記念撮影を楽しむ",
      "detail": "パノラマリフトで山頂へ・清里テラスで絶景と記念撮影",
      "questId": "q2-0",
      "note": "滞在予定11:04〜13:10。帰りのバスに余裕を持って移動。",
      "safeNote": "帰りのバスは13:10発。余裕を持って移動しよう。",
      "revealTime": "11:04",
      "needsVerification": true
    },
    {
      "id": "a2-lunch",
      "day": 2,
      "time": "12:00",
      "safeText": "昼食タイム！",
      "detail": "昼食タイム！",
      "questId": "q2-0",
      "note": "12時頃が目安。混雑に応じて変更可。13:10発のバスに注意。",
      "safeNote": "仮予定・要確認",
      "revealTime": "11:04",
      "needsVerification": true
    },
    {
      "id": "a2-bus-ready",
      "day": 2,
      "time": "12:55",
      "safeText": "13:10発のバスに備えてバス停へ",
      "detail": "サンメドウズ清里のバス停へ戻る",
      "questId": "q2-0",
      "note": "12:55は余裕を持つための目安。13:10発に乗車。",
      "safeNote": "12:55は目安。13:10発に余裕を持って備えよう。",
      "revealTime": "11:04",
      "needsVerification": true
    },
    {
      "id": "a2-5",
      "day": 2,
      "time": "13:10",
      "safeText": "清里ピクニックバスに乗車（北部周遊ルート）",
      "detail": "サンメドウズ清里から清泉寮へ（清里ピクニックバス・北部周遊ルート）",
      "questId": "q2-1",
      "note": "13:10発→13:18着",
      "safeNote": "仮予定・要確認",
      "revealTime": "13:18",
      "needsVerification": true
    },
    {
      "id": "a2-6",
      "day": 2,
      "time": "13:18",
      "safeText": "ひみつの目的地に到着",
      "detail": "清泉寮に到着",
      "questId": "q2-1",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "13:18",
      "needsVerification": true
    },
    {
      "id": "a2-7",
      "day": 2,
      "time": "13:20",
      "safeText": "ソフトクリーム・景色・記念撮影",
      "detail": "清泉寮の名物ソフトクリーム・景色・記念撮影・時間があればお土産",
      "questId": "q2-1",
      "note": "滞在13:18〜14:02。短時間のためレストラン昼食なし。",
      "safeNote": "短時間の滞在。ここでレストラン昼食は予定していません。",
      "revealTime": "13:18",
      "needsVerification": true
    },
    {
      "id": "a2-8",
      "day": 2,
      "time": "14:02",
      "safeText": "清里ピクニックバスに乗車（北部周遊ルート）",
      "detail": "清泉寮から清里駅へ（清里ピクニックバス・北部周遊ルート）",
      "questId": "q2-2",
      "note": "14:02発→14:15着",
      "safeNote": "仮予定・要確認",
      "revealTime": "14:15",
      "needsVerification": true
    },
    {
      "id": "a2-9",
      "day": 2,
      "time": "14:15",
      "safeText": "バスを乗り換え・14:20の出発まで5分",
      "detail": "清里駅に到着・大泉周遊ルートへ乗り換え",
      "questId": "q2-2",
      "note": "14:20発まで5分。乗り換えに備えよう。",
      "safeNote": "14:20発まで5分。乗り換えに備えよう。",
      "revealTime": "14:15",
      "needsVerification": true
    },
    {
      "id": "a2-10",
      "day": 2,
      "time": "14:20",
      "safeText": "清里ピクニックバスに乗車（大泉周遊ルート）",
      "detail": "清里駅からまきば公園へ（清里ピクニックバス・大泉周遊ルート）",
      "questId": "q2-2",
      "note": "14:20発→14:29着",
      "safeNote": "仮予定・要確認",
      "revealTime": "14:29",
      "needsVerification": true
    },
    {
      "id": "a2-11",
      "day": 2,
      "time": "14:29",
      "safeText": "ひみつの目的地に到着",
      "detail": "まきば公園に到着",
      "questId": "q2-2",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "14:29",
      "needsVerification": true
    },
    {
      "id": "a2-12",
      "day": 2,
      "time": "14:30",
      "safeText": "高原の景色・動物・散策・記念撮影",
      "detail": "まきば公園で高原の景色・動物・散策・記念撮影",
      "questId": "q2-2",
      "note": "滞在14:29〜16:04。15:50までにバス停へ。",
      "safeNote": "15:50までにバス停へ戻ろう。16:04発は必ず乗りたい便。",
      "revealTime": "14:29",
      "needsVerification": true
    },
    {
      "id": "a2-return-ready",
      "day": 2,
      "time": "15:50",
      "safeText": "帰りのバス停へ戻る",
      "detail": "まきば公園のバス停へ戻る",
      "questId": "q2-3",
      "note": "16:04発は必ず乗りたい帰還便。",
      "safeNote": "16:04発は必ず乗りたい帰還便。",
      "revealTime": "14:29",
      "needsVerification": true
    },
    {
      "id": "a2-13",
      "day": 2,
      "time": "16:04",
      "safeText": "清里ピクニックバスでホテル付近へ（清里ピクニックバス・大泉周遊ルート）",
      "detail": "まきば公園からホテル付近へ（清里ピクニックバス・大泉周遊ルート）",
      "questId": "q2-3",
      "note": "16:04発→16:14着。必ず乗りたい帰還便。",
      "safeNote": "16:04発→16:14着。必ず乗りたい帰還便。",
      "revealTime": "14:29",
      "needsVerification": true
    },
    {
      "id": "a2-14",
      "day": 2,
      "time": "16:14",
      "safeText": "ホテル付近に到着",
      "detail": "ホテル付近に到着",
      "questId": "q2-3",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "16:14",
      "needsVerification": true
    },
    {
      "id": "a2-15",
      "day": 2,
      "time": "18:00",
      "safeText": "ホテルで休憩・夕食・入浴",
      "detail": "ホテルでのんびり・夕食・温泉",
      "questId": "q2-3",
      "note": "夕方〜夜・時刻は目安",
      "safeNote": "仮予定・要確認",
      "revealTime": "18:00",
      "needsVerification": true
    },
    {
      "id": "a3-2",
      "day": 3,
      "time": "11:00",
      "safeText": "ホテルをチェックアウト",
      "detail": "ホテルをチェックアウト",
      "questId": "q3-0",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "11:00",
      "needsVerification": true
    },
    {
      "id": "a3-3",
      "day": 3,
      "time": "12:05",
      "safeText": "ホテル送迎バスに乗車",
      "detail": "ホテル送迎バスで甲斐大泉駅へ",
      "questId": "q3-1",
      "note": "チェックアウト後、12:05までホテルで待機できるか要確認。",
      "safeNote": "12:05までホテルで待機できるか要確認。",
      "revealTime": "13:02",
      "needsVerification": true
    },
    {
      "id": "a3-4",
      "day": 3,
      "time": "13:02",
      "safeText": "列車に乗車",
      "detail": "甲斐大泉駅から小海線に乗車",
      "questId": "q3-1",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "13:02",
      "needsVerification": true
    },
    {
      "id": "a3-5",
      "day": 3,
      "time": "13:17",
      "safeText": "乗り換え駅に到着",
      "detail": "小淵沢駅に到着",
      "questId": "q3-1",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "13:17",
      "needsVerification": true
    },
    {
      "id": "a3-6",
      "day": 3,
      "time": "13:52",
      "safeText": "特急列車に乗り換え",
      "detail": "小淵沢駅から特急あずさに乗車",
      "questId": "q3-1",
      "note": "",
      "safeNote": "仮予定・要確認",
      "revealTime": "13:52",
      "needsVerification": true
    },
    {
      "id": "a3-7",
      "day": 3,
      "time": "15:11",
      "safeText": "乗り換え駅に到着",
      "detail": "八王子駅に到着",
      "questId": "q3-1",
      "note": "15:11頃・要確認",
      "safeNote": "仮予定・要確認",
      "revealTime": "15:11",
      "needsVerification": true
    },
    {
      "id": "a3-8",
      "day": 3,
      "time": "16:10",
      "safeText": "おうちへ帰る",
      "detail": "帰宅予定",
      "questId": "q3-1",
      "note": "16:10頃・要確認",
      "safeNote": "仮予定・要確認",
      "revealTime": "16:10",
      "needsVerification": true
    }
  ],
  "quests": [
    {
      "id": "q1-0",
      "day": 1,
      "title": "冒険の始まり",
      "revealTime": "14:07",
      "actionIds": [
        "a1-0",
        "a1-1",
        "a1-2",
        "a1-3",
        "a1-4",
        "a1-5",
        "a1-6"
      ],
      "final": false
    },
    {
      "id": "q1-1",
      "day": 1,
      "title": "秘密の拠点を発見せよ！",
      "revealTime": "15:00",
      "actionIds": [
        "a1-7"
      ],
      "final": false
    },
    {
      "id": "q1-2",
      "day": 1,
      "title": "回復の泉でひとやすみ",
      "revealTime": "17:00",
      "actionIds": [
        "a1-8",
        "a1-9"
      ],
      "final": false
    },
    {
      "id": "q2-0",
      "day": 2,
      "title": "天空の絶景を発見せよ！",
      "revealTime": "11:04",
      "actionIds": [
        "a2-0",
        "a2-1",
        "a2-2",
        "a2-3",
        "a2-4",
        "a2-lunch",
        "a2-bus-ready"
      ],
      "final": false
    },
    {
      "id": "q2-1",
      "day": 2,
      "title": "伝説のソフトクリームを手に入れろ！",
      "revealTime": "13:18",
      "actionIds": [
        "a2-5",
        "a2-6",
        "a2-7"
      ],
      "final": false
    },
    {
      "id": "q2-2",
      "day": 2,
      "title": "高原の動物たちを探せ！",
      "revealTime": "14:29",
      "actionIds": [
        "a2-8",
        "a2-9",
        "a2-10",
        "a2-11",
        "a2-12"
      ],
      "final": false
    },
    {
      "id": "q2-3",
      "day": 2,
      "title": "回復の拠点へ帰還せよ！",
      "revealTime": "16:14",
      "actionIds": [
        "a2-return-ready",
        "a2-13",
        "a2-14",
        "a2-15"
      ],
      "final": false
    },
    {
      "id": "q3-0",
      "day": 3,
      "title": "帰り支度を整えよう！",
      "revealTime": "09:00",
      "actionIds": [
        "a3-2"
      ],
      "final": false
    },
    {
      "id": "q3-1",
      "day": 3,
      "title": "帰還クエスト",
      "revealTime": "12:00",
      "actionIds": [
        "a3-3",
        "a3-4",
        "a3-5",
        "a3-6",
        "a3-7",
        "a3-8"
      ],
      "final": false
    },
    {
      "id": "q3-2",
      "day": 3,
      "title": "QUEST COMPLETE!",
      "revealTime": "15:00",
      "actionIds": [],
      "final": true
    }
  ]
};
