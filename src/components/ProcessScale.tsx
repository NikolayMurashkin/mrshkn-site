import { useTranslations } from 'next-intl';
import { PROCESS_SCALE } from '@/content/process';
import type { ProcessScaleSegment } from '@/content/types';
import { PROCESS_PAYMENTS_AT_END, PROCESS_SCALE_LEGEND } from './consts';
import type { ProcessScaleClasses, ProcessScaleItem, ProcessScaleProps } from './types';

/** Классы шкалы из CSS-модуля направления: у всех четырех одни и те же имена с префиксом `scale`. */
export const processScaleClasses = (styles: Readonly<Record<string, string>>): ProcessScaleClasses => ({
  scale: styles.scale,
  track: styles.scaleTrack,
  segment: styles.scaleSegment,
  style: styles.scaleStyle,
  day: styles.scaleDay,
  pause: styles.scalePause,
  bar: styles.scaleBar,
  caption: styles.scaleCaption,
  label: styles.scaleLabel,
  payment: styles.scalePayment,
  paymentEnd: styles.scalePaymentEnd,
  legend: styles.scaleLegend,
  legendItem: styles.scaleLegendItem,
  swatch: styles.scaleSwatch,
  swatchStyle: styles.scaleSwatchStyle,
  swatchDay: styles.scaleSwatchDay,
  swatchPause: styles.scaleSwatchPause,
});

const segmentKey = (segment: ProcessScaleSegment) =>
  segment.kind === 'day' ? `day-${segment.day}` : segment.kind === 'pause' ? segment.pause : segment.kind;

/**
 * Шкала «дни и паузы» секции процесса: выбор стиля до дня 1, рабочие дни и паузы, пока заказчик смотрит работу,
 * платежи на своих отрезках. Подписи читаются списком; вид — классы и содержимое полос направления.
 */
export const ProcessScale = ({ classes, renderBar }: ProcessScaleProps) => {
  const t = useTranslations('process.scale');
  const items: ProcessScaleItem[] = PROCESS_SCALE.map((segment) => ({
    ...segment,
    key: segmentKey(segment),
    label:
      segment.kind === 'day'
        ? t('day', { day: segment.day })
        : segment.kind === 'pause'
          ? t(`pauses.${segment.pause}`)
          : t('style'),
    paymentLabel: segment.payment ? t(`payments.${segment.payment}`) : null,
    isPaymentAtEnd: segment.payment !== undefined && PROCESS_PAYMENTS_AT_END.includes(segment.payment),
  }));
  const swatch = { style: classes.swatchStyle, day: classes.swatchDay, pause: classes.swatchPause };

  return (
    <div className={classes.scale}>
      <ol className={classes.track}>
        {items.map((item) => (
          <li
            className={`${classes.segment} ${classes[item.kind]}`}
            key={item.key}
          >
            <span
              className={classes.bar}
              aria-hidden="true"
            >
              {renderBar?.(item)}
            </span>
            <span className={classes.caption}>
              <span className={classes.label}>{item.label}</span>
              {item.paymentLabel && ' '}
              {item.paymentLabel && (
                <span className={item.isPaymentAtEnd ? `${classes.payment} ${classes.paymentEnd}` : classes.payment}>
                  {item.paymentLabel}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      <ul className={classes.legend}>
        {PROCESS_SCALE_LEGEND.map((entry) => (
          <li
            className={classes.legendItem}
            key={entry.key}
          >
            <span
              className={`${classes.swatch} ${swatch[entry.kind]}`}
              aria-hidden="true"
            />
            {t(`legend.${entry.key}`)}
          </li>
        ))}
      </ul>
    </div>
  );
};
