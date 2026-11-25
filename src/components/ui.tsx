import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextProps, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children, refreshing, onRefresh, padded = true, scroll = true, footer,
}: {
  children: ReactNode; refreshing?: boolean; onRefresh?: () => void; padded?: boolean; scroll?: boolean; footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const pad = padded ? { padding: space.lg } : null;
  return (
    <View style={styles.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, { paddingBottom: space.xxl + (footer ? 0 : insets.bottom), gap: space.md }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.navy} /> : undefined}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad]}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>{footer}</View> : null}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export const H1 = ({ children }: { children: ReactNode }) => <Text style={styles.h1}>{children}</Text>;
export const H2 = ({ children }: { children: ReactNode }) => <Text style={styles.h2}>{children}</Text>;
export const Body = ({ style, ...props }: TextProps) => <Text {...props} style={[styles.body, style]} />;
export const Muted = ({ style, ...props }: TextProps) => <Text {...props} style={[styles.muted, style]} />;

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {action}
    </View>
  );
}

export function Button({
  title, onPress, variant = 'primary', loading, disabled, icon, small,
}: {
  title: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  loading?: boolean; disabled?: boolean; icon?: IconName; small?: boolean;
}) {
  const v = BUTTONS[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.button, small && styles.buttonSmall, { backgroundColor: v.bg, borderColor: v.border },
        pressed && !off && styles.pressed, off && { opacity: 0.5 },
      ]}>
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} /> : null}
          <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const BUTTONS = {
  primary: { bg: colors.navy, fg: '#fff', border: colors.navy },
  gold: { bg: colors.gold, fg: colors.navy, border: colors.gold },
  secondary: { bg: '#fff', fg: colors.navy, border: colors.line },
  ghost: { bg: 'transparent', fg: colors.navy, border: 'transparent' },
  danger: { bg: '#fff', fg: colors.red, border: colors.redSoft },
};

export function Field({ label, hint, error, ...props }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.faint}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }, error ? { borderColor: colors.red } : null, props.style]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : hint ? <Muted>{hint}</Muted> : null}
    </View>
  );
}

export function Badge({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function Row({
  title, subtitle, right, onPress, icon, iconColor = colors.navy, last,
}: {
  title: string; subtitle?: string; right?: ReactNode; onPress?: () => void; icon?: IconName; iconColor?: string; last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && styles.pressed]}>
      {icon ? (
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.muted} numberOfLines={3}>{subtitle}</Text> : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.faint} /> : null}
    </Pressable>
  );
}

export function Empty({ icon = 'leaf-outline', title, body, action }: { icon?: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={colors.faint} />
      <Text style={styles.h2}>{title}</Text>
      {body ? <Muted style={{ textAlign: 'center' }}>{body}</Muted> : null}
      {action}
    </View>
  );
}

export function Notice({ tone = 'info', children, icon }: { tone?: 'info' | 'warn' | 'error' | 'success'; children: ReactNode; icon?: IconName }) {
  const t = {
    info: { fg: colors.blue, bg: colors.blueSoft, i: 'information-circle' },
    warn: { fg: colors.amber, bg: colors.amberSoft, i: 'alert-circle' },
    error: { fg: colors.red, bg: colors.redSoft, i: 'close-circle' },
    success: { fg: colors.green, bg: colors.greenSoft, i: 'checkmark-circle' },
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: t.bg }]}>
      <Ionicons name={(icon || t.i) as IconName} size={20} color={t.fg} />
      <Text style={[styles.body, { color: t.fg, flex: 1 }]}>{children}</Text>
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.navy} />
      {label ? <Muted>{label}</Muted> : null}
    </View>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segmentItem, value === o.value && styles.segmentOn]}>
          <Text style={[styles.segmentText, value === o.value && { color: colors.navy }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** A tappable list of choices, one selected. */
export function ChoiceList<T>({
  items, selected, onSelect, label, sub, keyOf, empty,
}: {
  items: T[]; selected?: string; onSelect: (item: T) => void; label: (item: T) => string; sub?: (item: T) => string | undefined;
  keyOf: (item: T) => string; empty?: string;
}) {
  if (!items.length) return <Muted>{empty || 'Nothing to choose from.'}</Muted>;
  return (
    <Card style={{ padding: 0 }}>
      {items.map((item, i) => {
        const on = keyOf(item) === selected;
        return (
          <Pressable key={keyOf(item)} onPress={() => onSelect(item)} style={({ pressed }) => [styles.row, i < items.length - 1 && styles.rowLine, pressed && styles.pressed]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rowTitle, on && { color: colors.navy }]}>{label(item)}</Text>
              {sub?.(item) ? <Text style={styles.muted}>{sub(item)}</Text> : null}
            </View>
            <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? colors.navy : colors.faint} />
          </Pressable>
        );
      })}
    </Card>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  footer: { padding: space.lg, paddingTop: space.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line, gap: space.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.sm, borderWidth: 1, borderColor: colors.line },
  pressed: { opacity: 0.75 },
  h1: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, lineHeight: 22, color: colors.text },
  muted: { fontSize: 14, lineHeight: 20, color: colors.muted },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  section: { fontSize: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
  button: {
    minHeight: 50, borderRadius: radius.md, paddingHorizontal: space.lg, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: space.sm, borderWidth: 1,
  },
  buttonSmall: { minHeight: 38, paddingHorizontal: space.md },
  buttonText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  input: {
    minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: space.md,
    fontSize: 16, color: colors.text, backgroundColor: '#fff',
  },
  errorText: { color: colors.red, fontSize: 14 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg, minHeight: 56 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.lg },
  notice: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md, alignItems: 'flex-start' },
  loading: { padding: space.xxl, alignItems: 'center', gap: space.sm },
  segment: { flexDirection: 'row', backgroundColor: colors.line, borderRadius: radius.md, padding: 3 },
  segmentItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  segmentOn: { backgroundColor: '#fff' },
  segmentText: { fontSize: 14, fontWeight: '700', color: colors.muted },
});
