import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Questions, missingAnswer, type Question } from '@/components/Questions';
import { Button, Card, ChoiceList, Field, Loading, Muted, Notice, Screen, SectionTitle, Segmented } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys } from '@/lib/data';
import { classForBirthDate, entryCatalog } from '@/lib/entryVisibility';
import { date, money } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Animal, Exhibitor, Fair, Show } from '@/lib/types';

type Wizard = {
  fair: Fair; show: Show; exhibitors: Exhibitor[]; departments: any[]; divisions: any[]; classes: any[];
  animals: Animal[]; questions: Question[]; showmanship: { id: string; department_id: string; entry_fee: number }[];
};

const STEPS = ['Exhibitor', 'Department', 'Division', 'Class', 'Details', 'Review'];
const BLANK_ANIMAL = { name: '', breed: '', sex: '', ear_tag: '', birth_date: '' };
const BLANK_EXHIBITOR = { first_name: '', last_name: '', county: '', club: '', date_of_birth: '' };
const exName = (x?: { first_name?: string; last_name?: string }) => [x?.first_name, x?.last_name].filter(Boolean).join(' ');

export default function NewEntry() {
  const { showId } = useLocalSearchParams<{ showId: string }>();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: keys.wizard(showId),
    queryFn: () => call<Wizard>('exhibitorPortal', { action: 'wizard', show_id: showId }),
  });
  const w = q.data;
  const { divisions, classes } = useMemo(() => entryCatalog(w?.divisions || [], w?.classes || []), [w]);

  const [step, setStep] = useState(0);
  const [exMode, setExMode] = useState<'existing' | 'new'>('existing');
  const [exhibitorId, setExhibitorId] = useState('');
  const [newEx, setNewEx] = useState(BLANK_EXHIBITOR);
  const [deptId, setDeptId] = useState('');
  const [divId, setDivId] = useState('');
  const [classId, setClassId] = useState('');
  const [anMode, setAnMode] = useState<'existing' | 'new'>('existing');
  const [animalId, setAnimalId] = useState('');
  const [animal, setAnimal] = useState(BLANK_ANIMAL);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [smOptIn, setSmOptIn] = useState(false);
  const [smDob, setSmDob] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    if (w?.exhibitors.length && !exhibitorId) setExhibitorId(w.exhibitors[0].id);
    if (w && !w.exhibitors.length) setExMode('new');
  }, [w, exhibitorId]);

  if (q.isLoading) return <Loading label="Loading the show…" />;
  if (q.error || !w) return <Screen><Notice tone="error">{errorText(q.error)}</Notice></Screen>;

  const dept = w.departments.find((d) => d.id === deptId);
  const division = divisions.find((d: any) => d.id === divId);
  const isAnimal = (dept?.entry_type || 'animal') === 'animal';
  const animalMode = w.animals.length ? anMode : 'new';
  const byBirth = isAnimal && division?.class_break_method === 'birthdate';
  const birthDate = animalMode === 'existing' ? w.animals.find((a) => a.id === animalId)?.birth_date : animal.birth_date;
  const cls = byBirth ? classForBirthDate(classes, divId, birthDate) : classes.find((c: any) => c.id === classId);
  const fee = Number(cls?.entry_fee ?? division?.entry_fee ?? dept?.entry_fee ?? 0) || 0;
  const sm = w.showmanship.find((x) => x.department_id === deptId);
  const exhibitor = exMode === 'existing' ? w.exhibitors.find((x) => x.id === exhibitorId) : newEx;
  const questions = w.questions.filter((x) => !x.department_id || x.department_id === deptId);
  const divOptions = divisions.filter((d: any) => d.department_id === deptId);
  const classOptions = classes.filter((c: any) => c.division_id === divId);

  const canNext = () => {
    if (step === 0) return exMode === 'existing' ? !!exhibitorId : !!(newEx.first_name.trim() && newEx.last_name.trim());
    if (step === 1) return !!deptId;
    if (step === 2) return !!divId;
    if (step === 3) return byBirth || !!classId;
    if (step === 4) {
      if (isAnimal && !(animalMode === 'existing' ? animalId : animal.name.trim())) return false;
      if (byBirth && !cls) return false;
      return true;
    }
    return true;
  };

  const next = () => {
    setError('');
    if (step === 4) {
      const missing = missingAnswer(questions, answers);
      if (missing) return setError(missing);
      if (smOptIn && !exhibitor?.date_of_birth && !smDob) return setError("Enter the exhibitor's birth date for showmanship.");
    }
    // Birth-date divisions pick the class from the animal, so skip the class step.
    setStep((s) => (s === 2 && byBirth ? 4 : s + 1));
  };
  const back = () => setStep((s) => (s === 4 && byBirth ? 2 : Math.max(0, s - 1)));

  const addToCart = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await call<{ entry_number?: string; entry?: { entry_number?: string }; exhibitor_id?: string }>('createEntry', {
        source: 'exhibitor', show_id: showId, department_id: deptId, division_id: divId || undefined, class_id: cls?.id || undefined,
        exhibitor_id: exMode === 'existing' ? exhibitorId : undefined,
        new_exhibitor: exMode === 'new' ? newEx : undefined,
        animal_id: isAnimal && animalMode === 'existing' ? animalId : undefined,
        animal: isAnimal && animalMode === 'new' ? animal : undefined,
        showmanship_opt_in: smOptIn && sm ? true : undefined,
        date_of_birth: smOptIn && !exhibitor?.date_of_birth ? smDob || undefined : undefined,
        custom_fields: questions.length ? answers : undefined,
      });
      setAdded(String(res.entry_number || res.entry?.entry_number || ''));
      if (res.exhibitor_id) { setExMode('existing'); setExhibitorId(res.exhibitor_id); }
      qc.invalidateQueries({ queryKey: keys.account });
      qc.invalidateQueries({ queryKey: keys.wizard(showId) });
      qc.invalidateQueries({ queryKey: keys.fair(w.fair.id) });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const another = () => {
    setAdded(null);
    setDeptId(''); setDivId(''); setClassId('');
    setAnimal(BLANK_ANIMAL); setAnimalId(''); setAnMode('existing');
    setSmOptIn(false); setSmDob(''); setAnswers({}); setError('');
    setStep(1);
  };

  if (added !== null) {
    return (
      <Screen>
        <Notice tone="success">Added to your cart{added ? ` as entry #${added}` : ''}.</Notice>
        <Muted>Entries aren&apos;t sent to the show office until you check out.</Muted>
        <Button title="Add another entry" icon="add" variant="secondary" onPress={another} />
        <Button title="Go to cart" icon="cart" onPress={() => router.replace('/cart')} />
      </Screen>
    );
  }

  const footer = (
    <>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {step > 0 ? <View style={{ flex: 1 }}><Button title="Back" variant="secondary" onPress={back} /></View> : null}
        <View style={{ flex: 2 }}>
          {step < 5
            ? <Button title="Next" onPress={next} disabled={!canNext()} />
            : <Button title={`Add to cart · ${money(fee + (smOptIn && sm ? Number(sm.entry_fee) || 0 : 0))}`} icon="cart" onPress={addToCart} loading={busy} />}
        </View>
      </View>
    </>
  );

  return (
    <Screen footer={footer}>
      <View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy }}>{w.show.name}</Text>
        <Muted>{w.fair.name}{w.show.entry_close_date ? ` · Entries close ${date(w.show.entry_close_date)}` : ''}</Muted>
      </View>
      <Progress step={step} />

      {step === 0 ? (
        <>
          <SectionTitle>Who is showing?</SectionTitle>
          {w.exhibitors.length ? (
            <Segmented value={exMode} onChange={setExMode} options={[{ value: 'existing', label: 'Saved exhibitor' }, { value: 'new', label: 'Someone new' }]} />
          ) : null}
          {exMode === 'existing' ? (
            <ChoiceList items={w.exhibitors} selected={exhibitorId} onSelect={(x) => setExhibitorId(x.id)} keyOf={(x) => x.id}
              label={(x) => exName(x) || 'Exhibitor'} sub={(x) => [x.club, x.county].filter(Boolean).join(' · ') || undefined} />
          ) : (
            <Card>
              <Field label="First name" value={newEx.first_name} onChangeText={(v) => setNewEx({ ...newEx, first_name: v })} />
              <Field label="Last name" value={newEx.last_name} onChangeText={(v) => setNewEx({ ...newEx, last_name: v })} />
              <Field label="Birth date" value={newEx.date_of_birth} onChangeText={(v) => setNewEx({ ...newEx, date_of_birth: v })} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
              <Field label="County" value={newEx.county} onChangeText={(v) => setNewEx({ ...newEx, county: v })} />
              <Field label="Club or chapter" value={newEx.club} onChangeText={(v) => setNewEx({ ...newEx, club: v })} />
            </Card>
          )}
        </>
      ) : null}

      {step === 1 ? (
        <>
          <SectionTitle>Department</SectionTitle>
          <ChoiceList items={w.departments} selected={deptId} keyOf={(d) => d.id} label={(d) => d.name}
            sub={(d) => (d.entry_fee ? `${money(d.entry_fee)} per entry` : undefined)}
            onSelect={(d) => { setDeptId(d.id); setDivId(''); setClassId(''); setSmOptIn(false); }} empty="This show has no departments open yet." />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <SectionTitle>Division</SectionTitle>
          <ChoiceList items={divOptions} selected={divId} keyOf={(d: any) => d.id} label={(d: any) => d.name}
            sub={(d: any) => (d.class_break_method === 'birthdate' ? 'Class set by the animal’s birth date' : undefined)}
            onSelect={(d: any) => { setDivId(d.id); setClassId(''); }} empty="No divisions are open in this department." />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <SectionTitle>Class</SectionTitle>
          <ChoiceList items={classOptions} selected={classId} keyOf={(c: any) => c.id}
            label={(c: any) => `${c.code ? `${c.code} — ` : ''}${c.name}`}
            sub={(c: any) => [c.entry_fee != null ? money(c.entry_fee) : '', c.description].filter(Boolean).join(' · ') || undefined}
            onSelect={(c: any) => setClassId(c.id)} empty="No classes are open in this division." />
        </>
      ) : null}

      {step === 4 ? (
        <>
          {isAnimal ? (
            <>
              <SectionTitle>Animal</SectionTitle>
              {w.animals.length ? (
                <Segmented value={animalMode} onChange={setAnMode} options={[{ value: 'existing', label: 'Saved animal' }, { value: 'new', label: 'New animal' }]} />
              ) : null}
              {animalMode === 'existing' ? (
                <ChoiceList items={w.animals} selected={animalId} keyOf={(a) => a.id} label={(a) => a.name || a.ear_tag || 'Animal'}
                  sub={(a) => [a.breed, a.sex, a.ear_tag ? `Tag ${a.ear_tag}` : '', a.birth_date ? `Born ${date(a.birth_date)}` : ''].filter(Boolean).join(' · ') || undefined}
                  onSelect={(a) => setAnimalId(a.id)} />
              ) : (
                <Card>
                  <Field label="Name" value={animal.name} onChangeText={(v) => setAnimal({ ...animal, name: v })} />
                  <Field label="Breed" value={animal.breed} onChangeText={(v) => setAnimal({ ...animal, breed: v })} />
                  <Field label="Sex" value={animal.sex} onChangeText={(v) => setAnimal({ ...animal, sex: v })} />
                  <Field label="Ear tag" value={animal.ear_tag} onChangeText={(v) => setAnimal({ ...animal, ear_tag: v })} autoCapitalize="characters" />
                  <Field label={`Birth date${byBirth ? ' *' : ''}`} value={animal.birth_date} onChangeText={(v) => setAnimal({ ...animal, birth_date: v })}
                    placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
                </Card>
              )}
              {byBirth ? (
                cls ? <Notice tone="info">Class: {cls.code ? `${cls.code} — ` : ''}{cls.name}</Notice>
                  : birthDate ? <Notice tone="warn">No class in this division matches that birth date. Contact the show office.</Notice> : null
              ) : null}
            </>
          ) : null}
          {sm ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: colors.navy }}>Also enter showmanship</Text>
                  <Muted>{money(sm.entry_fee)} · age group from the exhibitor&apos;s birth date</Muted>
                </View>
                <Switch value={smOptIn} onValueChange={setSmOptIn} trackColor={{ true: colors.navy, false: colors.line }} />
              </View>
              {smOptIn && !exhibitor?.date_of_birth ? (
                <Field label="Exhibitor's birth date" value={smDob} onChangeText={setSmDob} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
              ) : null}
            </Card>
          ) : null}
          {questions.length ? (
            <>
              <SectionTitle>Questions from the show</SectionTitle>
              <Card>
                <Questions questions={questions} values={answers} organizationId={w.fair.id}
                  onChange={(k, v) => setAnswers((a) => ({ ...a, [k]: v }))} />
              </Card>
            </>
          ) : null}
          {!isAnimal && !sm && !questions.length ? <Muted>Nothing more is needed for this entry.</Muted> : null}
        </>
      ) : null}

      {step === 5 ? (
        <>
          <SectionTitle>Review</SectionTitle>
          <Card>
            <Line k="Exhibitor" v={exName(exhibitor) || 'New exhibitor'} />
            <Line k="Department" v={dept?.name} />
            <Line k="Division" v={division?.name} />
            <Line k="Class" v={cls ? `${cls.code ? `${cls.code} — ` : ''}${cls.name}` : ''} />
            {isAnimal ? <Line k="Animal" v={animalMode === 'existing' ? w.animals.find((a) => a.id === animalId)?.name : animal.name} /> : null}
            {smOptIn && sm ? <Line k="Showmanship" v={money(sm.entry_fee)} /> : null}
            <Line k="Entry fee" v={money(fee)} />
          </Card>
          <Muted>Any late fee is added when the entry goes in your cart.</Muted>
        </>
      ) : null}
    </Screen>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {STEPS.map((s, i) => (
        <View key={s} style={{ flex: 1, gap: 4 }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.navy : colors.line }} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: i === step ? colors.navy : colors.faint }} numberOfLines={1}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

function Line({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null;
  return (
    <Pressable style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 }}>
      <Muted>{k}</Muted>
      <Text style={{ flex: 1, textAlign: 'right', fontWeight: '700', color: colors.navy }}>{v}</Text>
    </Pressable>
  );
}
