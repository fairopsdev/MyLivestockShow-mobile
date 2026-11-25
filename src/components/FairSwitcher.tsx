import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrentFair } from '@/lib/fair';
import { colors, radius, space } from '@/lib/theme';

// "County Fair ▾" — switch which fair the Ring, Results and Home cards show.
export function FairSwitcher({ light }: { light?: boolean }) {
  const { fairs, fair, setFairId } = useCurrentFair();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  if (!fair) return null;
  const color = light ? '#fff' : colors.muted;
  return (
    <>
      <Pressable onPress={() => fairs.length > 1 && setOpen(true)} style={s.trigger} accessibilityRole="button" accessibilityLabel={`Fair: ${fair.name}`}>
        <Text style={[s.name, { color }]} numberOfLines={1}>{fair.name}</Text>
        {fairs.length > 1 ? <Ionicons name="chevron-down" size={16} color={color} /> : null}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + space.lg }]}>
            <Text style={s.title}>Choose a fair</Text>
            {fairs.map((f) => (
              <Pressable key={f.id} style={s.option} onPress={() => { setFairId(f.id); setOpen(false); }}>
                <Text style={[s.optionText, f.id === fair.id && { fontWeight: '800' }]}>{f.name}</Text>
                {f.id === fair.id ? <Ionicons name="checkmark" size={20} color={colors.navy} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 2 },
  name: { fontSize: 15, fontWeight: '700', maxWidth: 260 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,40,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, gap: 4 },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: colors.muted, textTransform: 'uppercase', marginBottom: space.sm },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  optionText: { fontSize: 17, color: colors.navy },
});
