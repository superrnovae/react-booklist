/**
 * Formulaire d'ajout/édition d'un ouvrage (react-hook-form + zod).
 * Validation typée, message par champ, soumission désactivée pendant l'envoi,
 * remontée des erreurs 422 de l'API sur les bons champs.
 */
import { Bouton, Champ, EtoilesNote, Texte } from '@/components';
import type { SaisieLivre } from '@/domain/types';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Switch, View } from 'react-native';
import { schemaFormulaireLivre, versSaisie, type ValeursFormulaireLivre } from './form';

type Props = {
  valeursInitiales?: Partial<ValeursFormulaireLivre>;
  enCours: boolean;
  erreursServeur?: Record<string, string>;
  libelleAction: string;
  onSoumettre: (saisie: SaisieLivre) => void;
};

const CHAMPS = ['titre', 'auteur', 'editeur', 'annee'] as const;

export function FormulaireLivre({
  valeursInitiales,
  enCours,
  erreursServeur,
  libelleAction,
  onSoumettre,
}: Props) {
  const { t } = useI18n();
  const palette = usePalette();

  const { control, handleSubmit, setError, formState } = useForm<ValeursFormulaireLivre>({
    resolver: zodResolver(schemaFormulaireLivre),
    defaultValues: {
      titre: '',
      auteur: '',
      editeur: '',
      annee: new Date().getFullYear(),
      lu: false,
      favori: false,
      note: null,
      ...valeursInitiales,
    },
  });

  useEffect(() => {
    if (!erreursServeur) return;
    for (const [champ, message] of Object.entries(erreursServeur)) {
      setError(champ as keyof ValeursFormulaireLivre, { type: 'server', message });
    }
  }, [erreursServeur, setError]);

  const soumettre = handleSubmit((valeurs) => {
    onSoumettre(versSaisie(schemaFormulaireLivre.parse(valeurs)));
  });

  const messageErreur = (cle: string): string | undefined => {
    const e = formState.errors[cle as keyof ValeursFormulaireLivre];
    if (!e) return undefined;
    if (cle === 'annee') return t('messages.anneeInvalide');
    return e.message === 'requis' ? t('messages.champObligatoire') : (e.message as string);
  };

  return (
    <View style={styles.form}>
      {CHAMPS.map((cle) => (
        <Controller
          key={cle}
          control={control}
          name={cle}
          render={({ field }) => (
            <Champ
              libelle={t(`livre.${cle}`)}
              erreur={messageErreur(cle)}
              value={cle === 'annee' ? String(field.value ?? '') : (field.value as string)}
              keyboardType={cle === 'annee' ? 'number-pad' : 'default'}
              onChangeText={(txt) =>
                field.onChange(cle === 'annee' ? (txt === '' ? undefined : Number(txt)) : txt)
              }
              onBlur={field.onBlur}
            />
          )}
        />
      ))}

      {(['lu', 'favori'] as const).map((cle) => (
        <Controller
          key={cle}
          control={control}
          name={cle}
          render={({ field }) => (
            <View style={styles.bascule}>
              <Texte>{t(`livre.${cle}`)}</Texte>
              <Switch
                value={field.value as boolean}
                onValueChange={field.onChange}
                accessibilityLabel={t(`livre.${cle}`)}
                trackColor={{ true: palette.primaire, false: palette.surfaceEnfoncee }}
              />
            </View>
          )}
        />
      ))}

      <Controller
        control={control}
        name="note"
        render={({ field }) => (
          <View style={styles.bascule}>
            <Texte>{t('livre.note')}</Texte>
            <EtoilesNote
              valeur={field.value as number | null}
              onChange={field.onChange}
              libelle={t('livre.note')}
            />
          </View>
        )}
      />

      <Bouton
        titre={libelleAction}
        onPress={soumettre}
        enCours={enCours}
        desactive={formState.isSubmitting}
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: espacements.lg },
  bascule: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: { marginTop: espacements.sm },
});
