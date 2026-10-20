import { useEffect, useState } from "react";
import { Box, Button, Heading, List, ListItem, Slider, Stack, Text } from "@zen-ds/react";
import { PlayerAvatar, Ranked } from "../components/common";
import { formatPoints } from "../lib/format";
import type { StepView } from "../lib/types";

/** Số có đơn vị. Năm thì không có dấu chấm ngăn cách hàng nghìn. */
export const formatEstimate = (value: number, unit: string) => (unit ? `${formatPoints(value)} ${unit}` : String(value));

const snap = (value: number, min: number, step: number) => min + Math.round((value - min) / step) * step;

/** Đoán gần đúng: học viên kéo thanh trượt rồi chốt con số. */
export function EstimateInput({ step, chosen, timeUp, onSubmit }: { step: StepView; chosen: number | null; timeUp: boolean; onSubmit: (value: number) => void }) {
  const range = step.range!;
  const [value, setValue] = useState(() => snap((range.min + range.max) / 2, range.min, range.step));
  useEffect(() => setValue(snap((range.min + range.max) / 2, range.min, range.step)), [step.id, range.min, range.max, range.step]);
  const locked = chosen !== null || timeUp;
  const shown = chosen ?? value;

  return (
    <Box surface="surface" radius="2xl" padding="xl">
      <Stack gap="lg">
        <Text tone="base" align="center">
          {locked ? "Con số bạn đã chốt" : "Kéo thanh trượt tới con số bạn đoán"}
        </Text>
        <Text as="span" textStyle="Display/2" align="center" tabularNumbers aria-live="polite">
          {formatEstimate(shown, range.unit)}
        </Text>
        <Slider
          size="lg"
          theme="accent"
          icon={false}
          showLimits
          min={range.min}
          max={range.max}
          step={range.step}
          value={shown}
          disabled={locked}
          onValueChange={setValue}
          aria-label="Con số bạn đoán"
          valueText={(v) => formatEstimate(v, range.unit)}
        />
        {chosen === null && (
          <Button level="primary" size="lg" startIcon="icon-target-04-line" onClick={() => onSubmit(value)} disabled={timeUp}>
            Chốt đáp án
          </Button>
        )}
      </Stack>
    </Box>
  );
}

/** Đáp án Đoán gần đúng, kèm con số của bạn và trung bình cả lớp. */
export function EstimateAnswer({ step, large = false, mine = null }: { step: StepView; large?: boolean; mine?: number | null }) {
  const result = step.estimate;
  const range = step.range;
  if (!result || !range) return null;
  const notes = [mine !== null ? `Bạn đoán ${formatEstimate(mine, range.unit)}` : null, result.average !== null ? `Trung bình cả lớp ${formatEstimate(result.average, range.unit)}` : null].filter(Boolean);
  return (
    <Stack gap="2xs" align="center">
      <Text as="span" textStyle={large ? "Heading/4" : "Body/Base/Medium"} tone="base">
        Đáp án
      </Text>
      <Text as="span" textStyle={large ? "Display-Extra/1" : "Display/2"} tone="accent-base" align="center" tabularNumbers>
        {formatEstimate(result.answer, range.unit)}
      </Text>
      {notes.length > 0 && (
        <Text textStyle={large ? "Body/Extra/Regular" : "Body/Base/Regular"} tone="base" align="center">
          {notes.join(" · ")}
        </Text>
      )}
    </Stack>
  );
}

/** Ba bạn đoán sát nhất. */
export function EstimateClosest({ step, large = false }: { step: StepView; large?: boolean }) {
  const result = step.estimate;
  const range = step.range;
  if (!result || !range || result.closest.length === 0) return null;
  return (
    <Stack gap="xs">
      <Heading level={3} textStyle={large ? "Heading/3" : "Heading/Subheading"}>
        Đoán sát nhất
      </Heading>
      <List aria-label="Các bạn đoán sát nhất">
        {result.closest.map((guess, index) => (
          <ListItem
            key={guess.id}
            leading={<PlayerAvatar name={guess.name} avatar={guess.avatar} size={large ? "lg" : "md"} />}
            title={<Ranked rank={index + 1}>{guess.name}</Ranked>}
            caption={`Lệch ${formatEstimate(Math.abs(guess.guess - result.answer), range.unit)}`}
            value={formatEstimate(guess.guess, range.unit)}
          />
        ))}
      </List>
    </Stack>
  );
}

/** Kết quả Đoán gần đúng trên điện thoại: đáp án, trung bình cả lớp và các bạn đoán sát nhất. */
export function EstimateResult({ step, mine = null }: { step: StepView; mine?: number | null }) {
  if (!step.estimate || !step.range) return null;
  return (
    <Box surface="surface" radius="2xl" padding="xl">
      <Stack gap="lg">
        <EstimateAnswer step={step} mine={mine} />
        <EstimateClosest step={step} />
      </Stack>
    </Box>
  );
}
