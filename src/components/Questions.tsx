import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Button, Field, Muted, Notice } from '@/components/ui';
import { errorText } from '@/lib/api';
import { colors, radius } from '@/lib/theme';
import { uploadPrivate, type UploadedFile } from '@/lib/upload';

// A show's own entry-form questions (the fields staff set up in Fair Central).
export type Question = {
  field_key: string; field_label: string; field_type: string; required?: boolean; options?: string;
  help_text?: string; placeholder?: string; max_files?: number; department_id?: string;
};

export function missingAnswer(questions: Question[], values: Record<string, any>) {
  for (const q of questions) {
    if (!q.required) continue;
    const v = values[q.field_key];
    if (q.field_type === 'file' ? !(Array.isArray(v) && v.length) : q.field_type !== 'boolean' && !String(v ?? '').trim()) {
      return q.field_type === 'file' ? `Attach ${q.field_label}.` : `Answer "${q.field_label}".`;
    }
  }
  return '';
}

export function Questions({
  questions, values, onChange, organizationId,
}: {
  questions: Question[]; values: Record<string, any>; onChange: (key: string, value: any) => void; organizationId: string;
}) {
  return (
    <View style={{ gap: 14 }}>
      {questions.map((q) => {
        const label = `${q.field_label}${q.required ? ' *' : ''}`;
        const v = values[q.field_key];
        switch (q.field_type) {
          case 'boolean':
            return (
              <View key={q.field_key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.navy }}>{label}</Text>
                <Switch value={!!v} onValueChange={(x) => onChange(q.field_key, x)} trackColor={{ true: colors.navy, false: colors.line }} />
              </View>
            );
          case 'select': {
            const opts = String(q.options || '').split(',').map((o) => o.trim()).filter(Boolean);
            return (
              <View key={q.field_key} style={{ gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.navy }}>{label}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {opts.map((o) => (
                    <Pressable key={o} onPress={() => onChange(q.field_key, o)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: v === o ? colors.navy : colors.line, backgroundColor: v === o ? colors.navy : '#fff' }}>
                      <Text style={{ color: v === o ? '#fff' : colors.navy, fontWeight: '600' }}>{o}</Text>
                    </Pressable>
                  ))}
                </View>
                {q.help_text ? <Muted>{q.help_text}</Muted> : null}
              </View>
            );
          }
          case 'file':
            return <FileQuestion key={q.field_key} q={q} label={label} files={Array.isArray(v) ? v : []} organizationId={organizationId}
              onChange={(list) => onChange(q.field_key, list)} />;
          default:
            return (
              <Field key={q.field_key} label={label} value={v == null ? '' : String(v)} onChangeText={(x) => onChange(q.field_key, x)}
                hint={q.help_text || (q.field_type === 'date' ? 'YYYY-MM-DD' : undefined)} placeholder={q.placeholder}
                multiline={q.field_type === 'textarea'} keyboardType={q.field_type === 'number' ? 'decimal-pad' : 'default'} />
            );
        }
      })}
    </View>
  );
}

function FileQuestion({
  q, label, files, onChange, organizationId,
}: { q: Question; label: string; files: UploadedFile[]; onChange: (list: UploadedFile[]) => void; organizationId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const max = Math.max(1, Number(q.max_files) || 1);

  const add = async (file: { uri: string; name: string; type: string; size?: number }) => {
    setError('');
    setBusy(true);
    try {
      const uri = await uploadPrivate(file, { kind: 'documents', scope: 'submission', organizationId });
      onChange([...files, { file_uri: uri, name: file.name, size: file.size || 0, type: file.type }]);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const photo = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return setError('Allow camera access to photograph the document.');
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    const a = !res.canceled ? res.assets[0] : null;
    if (a) add({ uri: a.uri, name: a.fileName || `${q.field_key}.jpg`, type: a.mimeType || 'image/jpeg', size: a.fileSize });
  };

  const file = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    const a = !res.canceled ? res.assets[0] : null;
    if (a) add({ uri: a.uri, name: a.name, type: a.mimeType || 'application/octet-stream', size: a.size });
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.navy }}>{label}</Text>
      {q.help_text ? <Muted>{q.help_text}</Muted> : null}
      {files.map((f, i) => (
        <View key={f.file_uri} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.md, backgroundColor: colors.bg }}>
          <Ionicons name="document-attach" size={18} color={colors.navy} />
          <Text style={{ flex: 1, color: colors.navy }} numberOfLines={1}>{f.name}</Text>
          <Pressable onPress={() => onChange(files.filter((_, j) => j !== i))} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.faint} />
          </Pressable>
        </View>
      ))}
      {files.length < max ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button title="Take photo" icon="camera" variant="secondary" small onPress={photo} loading={busy} /></View>
          <View style={{ flex: 1 }}><Button title="Choose file" icon="folder-open" variant="secondary" small onPress={file} disabled={busy} /></View>
        </View>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </View>
  );
}
