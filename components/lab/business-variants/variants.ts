/** The lab's variants: id (?v=), short label for the switcher, and a Japanese caption. */
export const LAB_VARIANTS = [
  {
    id: "a",
    label: "積み重ね",
    name: "A. 現在の積み重ね",
    caption: "現行のトップページと同じ表現。カードが下から迫り上がり、前のカードは少し縮みながら奥に重なっていきます。",
  },
  {
    id: "b",
    label: "横スクロール",
    name: "B. 横スクロール",
    caption: "縦スクロールに合わせて4枚のパネルが横へ流れます。画面は固定され、進捗バーと「01 / 04」で現在地を表示。写真はパネル内でわずかに視差移動します。",
  },
  {
    id: "c",
    label: "左右分割",
    name: "C. 左右分割スティッキー",
    caption: "PCは左に事業名と大きな番号、右に写真。スクロールで次の写真が下からワイプで現れ、文章が切り替わります。スマホは上に写真・下に文章。ドットで各事業へ移動できます。",
  },
  {
    id: "d",
    label: "全画面ワイプ",
    name: "D. 全画面ワイプ",
    caption: "事業ごとに全画面のシーン。ロゴの欠片のような斜めの平行四辺形が広がって写真が現れ、少し引きながら文字がスライドインします。",
  },
  {
    id: "e",
    label: "3D回転",
    name: "E. 3D回転",
    caption: "4面の立体にカードを配置し、スクロールで回転させて各事業を正面に。PCは角柱の回転、スマホは読みやすいカバーフロー（角度控えめ）です。",
  },
] as const;

export type LabVariantId = (typeof LAB_VARIANTS)[number]["id"];

/** The variant for a `?v=` value: case-insensitive, defaulting to "a". */
export function parseVariant(value: string | null | undefined): LabVariantId {
  const v = value?.trim().toLowerCase();
  return LAB_VARIANTS.find((x) => x.id === v)?.id ?? "a";
}
