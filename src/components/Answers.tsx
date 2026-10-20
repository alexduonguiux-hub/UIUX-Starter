import { Badge, Box, Card, DockIcon, Grid, Image, ProgressBar, Stack, Text, type CardColor, type DockIconTheme, type IconName } from "@zen-ds/react";
import type { StepView } from "../lib/types";
import { svgUrl } from "../lib/format";
import { EmojiArt } from "./Fun";

/** Mỗi đáp án có hình, chữ cái và màu riêng, để không chỉ dựa vào màu sắc. */
const MARKS: Array<{ icon: IconName; theme: DockIconTheme; card: CardColor; letter: string }> = [
  { icon: "icon-triangle-solid", theme: "orange", card: "orange", letter: "A" },
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
}

export function Answers({ step, state, chosen = null, onChoose, large = false }: AnswersProps) {
  const options = step.options ?? [];
  const counts = step.counts ?? null;
  const total = counts ? counts.reduce((sum, count) => sum + count, 0) : 0;
  const isPoll = step.game === "poll";
  const pictures = step.images ?? null;
  const art = step.optionArt ?? null;
  const bigArt = Boolean(art) && step.game === "poll";
  const columns = pictures || options.length === 2 ? 2 : { mobile: 1, tablet: 2, desktop: 2 };

  return (
    <Grid columns={columns} gap={large ? "md" : "sm"}>
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
            theme="subtle"
            color={mark.card}
            spacing={large ? "md" : "sm"}
            selected={state === "reveal" ? isRight : isChosen}
            onClick={clickable ? () => onChoose(index) : undefined}
            aria-label={clickable ? `Chọn ${name}` : undefined}
          >
            <Stack gap="sm">
              {pictures?.[index] && (
                <Box maxWidth={large ? 400 : undefined} width="fill" alignSelf="center">
                  <Image src={svgUrl(pictures[index].svg)} alt={pictures[index].alt} ratio={4 / 3} fit="contain" radius="lg" loading="eager" />
                </Box>
              )}
              {bigArt && art?.[index] && (
                <Stack align="center" paddingY={large ? "md" : "xs"}>
                  <EmojiArt size={large ? "xl" : "lg"}>{art[index]}</EmojiArt>
                </Stack>
              )}
              <Stack direction="row" gap={pictures && !large ? "xs" : "sm"} align="center">
                <DockIcon icon={mark.icon} theme={mark.theme} size={large ? "md" : pictures ? "xs" : "sm"} label={`Đáp án ${mark.letter}`} />
                {!bigArt && art?.[index] && <EmojiArt size="md">{art[index]}</EmojiArt>}
                <Text textStyle={large ? "Heading/4" : pictures ? "Body/Base/Medium" : "Body/Extra/Medium"} width="fill">
                  {label}
                </Text>
              </Stack>
              {state === "reveal" && counts && (
                <Stack gap="xs">
                  <ProgressBar value={share} theme={isRight ? "accent" : "neutral"} aria-label={`${counts[index]} người chọn ${label}`} />
                  <Stack direction="row" gap="xs" align="center" wrap>
                    <Text as="span" textStyle="Body/Small/Medium" tone="base">{`${counts[index]} người · ${share}%`}</Text>
                    {isRight && (
                      <Badge theme="green" background="subtle" size="sm" leading="icon-check-circle-solid">
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
              )}
              {state === "waiting" && isChosen && (
                <Badge theme="blue" background="subtle" size="sm" leading="icon-check-circle-solid">
                  Đã chọn
                </Badge>
              )}
            </Stack>
          </Card>
        );
      })}
    </Grid>
  );
}
