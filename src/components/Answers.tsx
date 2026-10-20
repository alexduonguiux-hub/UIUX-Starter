import { Badge, Box, Card, DockIcon, Grid, Image, ProgressBar, Stack, Text, type CardColor, type DockIconTheme, type IconName } from "@zen-ds/react";
import type { StepView } from "../lib/types";
import { svgUrl } from "../lib/format";
import { EmojiArt } from "./Fun";

/**
 * Mỗi đáp án có hình, chữ cái và màu riêng, để không chỉ dựa vào màu sắc.
 * Bốn màu là bộ bốn cách đều trên vòng màu, xuất phát từ màu brand: hồng 341°, vàng 81°, xanh lá 147°, xanh dương 259°
 * (cách nhau 66–112°), cùng quy ước đỏ/xanh/vàng/lục quen thuộc của các trò quiz.
 */
const MARKS: Array<{ icon: IconName; theme: DockIconTheme; card: CardColor; letter: string }> = [
  { icon: "icon-triangle-solid", theme: "pink", card: "brand", letter: "A" },
  { icon: "icon-diamond-solid", theme: "blue", card: "blue", letter: "B" },
  { icon: "icon-circle-solid", theme: "yellow", card: "yellow", letter: "C" },
  { icon: "icon-square-solid", theme: "green", card: "green", letter: "D" },
];

export const optionLetter = (index: number) => MARKS[index]?.letter ?? String(index + 1);

interface AnswersProps {
  step: StepView;
  /** "answer": học viên đang chọn · "waiting": đã chọn, chờ công bố · "reveal": công bố đáp án. */
  state: "answer" | "waiting" | "reveal";
  /** Lựa chọn của học viên này (nếu có). */
  chosen?: number | null;
  onChoose?: (index: number) => void;
  /** Màn chiếu dùng chữ to hơn. */
  large?: boolean;
  /** Màn chiếu, đáp án chiếm cả sân khấu (không có hình minh hoạ bên cạnh): thẻ rộng, chữ to nhất. */
  wide?: boolean;
  /** Màn chiếu thấp: lề trong thẻ và khoảng cách giữa các thẻ nhỏ hơn một bậc, chữ giữ nguyên cỡ. */
  dense?: boolean;
  /** Màn chiếu rất thấp (laptop phóng to): mọi đáp án xếp một hàng, mỗi thẻ đủ cao cho chữ và số người chọn. */
  oneRow?: boolean;
}

export function Answers({ step, state, chosen = null, onChoose, large = false, wide = false, dense = false, oneRow = false }: AnswersProps) {
  const options = step.options ?? [];
  const counts = step.counts ?? null;
  const total = counts ? counts.reduce((sum, count) => sum + count, 0) : 0;
  const isPoll = step.game === "poll";
  const pictures = step.images ?? null;
  const art = step.optionArt ?? null;
  const bigArt = Boolean(art) && (step.game === "poll" || step.game === "truth");
  // Đáp án dạng hình: màn chiếu 2 cột; điện thoại 1 cột để mỗi hình đủ rộng mà đọc được chữ trong hình.
  const columns = oneRow ? options.length : pictures ? (large ? 2 : 1) : options.length === 2 ? 2 : { mobile: 1, tablet: 2, desktop: 2 };
  // Màn chiếu: thẻ đáp án kiểu ô lớn (như Kahoot), hình và chữ canh giữa thẻ, số người chọn nằm sát đáy.
  const tile = large && !pictures;
  // Cỡ chữ theo chỗ trống: thẻ rộng cả sân khấu dùng cỡ lớn nhất; đáp án dài, cột hẹp hoặc màn thấp lùi một bậc.
  const tileStyle = (label: string) => {
    const scale = wide ? (dense ? ["Heading/2", "Heading/3"] : ["Display/4", "Heading/1"]) : dense ? ["Heading/4", "Body/Extra/Medium"] : ["Heading/3", "Heading/4"];
    return (label.length > 32 ? scale[1] : scale[0]) as "Display/4" | "Heading/1" | "Heading/2" | "Heading/3" | "Heading/4" | "Body/Extra/Medium";
  };

  /** Số người chọn một đáp án khi công bố: thanh tỉ lệ, số người, nhãn đáp án đúng hoặc lựa chọn của bạn. */
  const stats = (index: number, isRight: boolean, isChosen: boolean, share: number) => (
    <Stack gap="xs">
      <ProgressBar value={share} theme={isRight ? "accent" : "neutral"} aria-label={`${counts?.[index] ?? 0} người chọn ${options[index]}`} />
      <Stack direction="row" gap="xs" align="center" wrap>
        <Text as="span" textStyle={large ? "Body/Extra/Medium" : "Body/Small/Medium"} tone="base">{`${counts?.[index] ?? 0} người · ${share}%`}</Text>
        {isRight && (
          <Badge theme="green" background="subtle" size={large ? "md" : "sm"} leading="icon-check-circle-solid">
            {isPoll ? "Số đông" : "Đáp án đúng"}
          </Badge>
        )}
        {isChosen && !isRight && (
          <Badge theme="neutral" background="subtle" size="sm" leadingIcon={false}>
            Bạn chọn
          </Badge>
        )}
      </Stack>
    </Stack>
  );

  return (
    <Grid columns={columns} gap={large && !dense ? "md" : "sm"}>
      {options.map((label, index) => {
        const mark = MARKS[index] ?? MARKS[0];
        const isRight = state === "reveal" && (isPoll ? (step.majority ?? []).includes(index) : step.answer === index);
        const isChosen = chosen === index;
        const share = counts && total ? Math.round((counts[index] / total) * 100) : 0;
        const clickable = state === "answer" && onChoose;
        const name = pictures ? `${label}: ${pictures[index]?.alt ?? ""}` : label;
        return (
          <Card
            key={index}
            className={tile ? "answer-tile" : undefined}
            theme="subtle"
            color={mark.card}
            spacing={large && !dense ? "md" : "sm"}
            selected={state === "reveal" ? isRight : isChosen}
            onClick={clickable ? () => onChoose(index) : undefined}
            aria-label={clickable ? `Chọn ${name}` : undefined}
          >
            {tile ? (
              <div className="answer-tile__body">
                <Stack gap="md" align={bigArt ? "center" : "stretch"} className="answer-tile__main">
                  {bigArt && art?.[index] && <EmojiArt size={wide && !dense ? "lg" : "md"}>{art[index]}</EmojiArt>}
                  <Stack direction="row" gap="md" align="center">
                    <DockIcon icon={mark.icon} theme={mark.theme} size={wide && !dense ? "xl" : "lg"} label={`Đáp án ${mark.letter}`} />
                    {!bigArt && art?.[index] && <EmojiArt size="md">{art[index]}</EmojiArt>}
                    <Text textStyle={tileStyle(label)} width="fill">
                      {label}
                    </Text>
                  </Stack>
                </Stack>
                {state === "reveal" && counts && <div className="answer-tile__stats">{stats(index, isRight, isChosen, share)}</div>}
              </div>
            ) : (
              <Stack gap="sm">
                {pictures?.[index] && (
                  <Box className={large ? "answer-picture" : undefined} maxWidth={large ? 400 : undefined} width="fill" alignSelf="center">
                    <Image src={svgUrl(pictures[index].svg)} alt={pictures[index].alt} ratio={4 / 3} fit="contain" radius="lg" loading="eager" />
                  </Box>
                )}
                {bigArt && art?.[index] && (
                  <Stack align="center" paddingY={large ? "md" : "xs"}>
                    <EmojiArt size="lg">{art[index]}</EmojiArt>
                  </Stack>
                )}
                <Stack direction="row" gap={pictures && !large ? "xs" : "sm"} align="center">
                  <DockIcon icon={mark.icon} theme={mark.theme} size={large ? "md" : pictures ? "xs" : "sm"} label={`Đáp án ${mark.letter}`} />
                  {!bigArt && art?.[index] && <EmojiArt size="md">{art[index]}</EmojiArt>}
                  <Text textStyle={large ? "Heading/4" : pictures ? "Body/Base/Medium" : "Body/Extra/Medium"} width="fill">
                    {label}
                  </Text>
                </Stack>
                {state === "reveal" && counts && stats(index, isRight, isChosen, share)}
                {state === "waiting" && isChosen && (
                  <Badge theme="blue" background="subtle" size="sm" leading="icon-check-circle-solid">
                    Đã chọn
                  </Badge>
                )}
              </Stack>
            )}
          </Card>
        );
      })}
    </Grid>
  );
}
