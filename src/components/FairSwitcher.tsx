import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALL, useCurrentFair } from '@/lib/fair';
import { colors, radius, space } from '@/lib/theme';

// "Showing: All my fairs ▾" / "Your fair: County Fair ▾" — which fairs Home,
// the Ring and Results show.
export function FairSwitcher() {
  const { fairs, fair, allMode, setFairId } = useCurrentFair();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  if (!fairs.length) return null;
  const many = fairs.length > 1;
  const label = allMode ? 'All my fairs' : fair?.name || '';
  const choose = (id: string) => { setFairId(id); setOpen(false); };
  return (
    <>
      <Pressable onPress={() => many && setOpen(true)} style={s.trigger} accessibilityRole="button"
        accessibilityLabel={`${allMode ? 'Showing' : 'Your fair'}: ${label}${many ? '. Tap to change' : ''}`}>
        <Text style={s.prefix}>{allMode ? 'Showing:' : 'Your fair:'}</Text>
        <Text style={s.name} numberOfLines={1}>{label}</Text>
        {many ? <Ionicons name="chevron-down" size={16} color={colors.navy} /> : null}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + space.lg }]}>
            <Text style={s.title}>Show</Text>
            <Option label="All my fairs" sub={`${fairs.length} fairs together`} on={allMode} onPress={() => choose(ALL)} />
            {fairs.map((f) => <Option key={f.id} label={f.name} on={!allMode && f.id === fair?.id} onPress={() => choose(f.id)} />)}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function Option({ label, sub, on, onPress }: { label: string; sub?: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable style={s.option} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={[s.optionText, on && { fontWeight: '800' }]}>{label}</Text>
        {sub ? <Text style={s.sub}>{sub}</Text> : null}
      </View>
      {on ? <Ionicons name="checkmark" size={20} color={colors.navy} /> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, maxWidth: '100%' },
  prefix: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  name: { fontSize: 14, fontWeight: '800', color: colors.navy, flexShrink: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,40,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, gap: 4 },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: colors.muted, textTransform: 'uppercase', marginBottom: space.sm },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  optionText: { fontSize: 17, color: colors.navy },
  sub: { fontSize: 13, color: colors.muted },
});
