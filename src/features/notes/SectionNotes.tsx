/**
 * Section « Notes de lecture » d'une fiche (composant de feature).
 * Affichage horodaté, ajout, suppression. Les quatre états gérés.
 */
import { Bouton, Carte, EtatErreur, EtatVide, Squelette, Texte } from '@/components';
import type { Note } from '@/domain/types';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { CIBLE_TACTILE, espacements, rayons, typographie } from '@/theme/tokens';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useAjouterNote, useNotes, useSupprimerNote } from './hooks';

export function SectionNotes({ livreId, lectureSeule = false }: { livreId: string; lectureSeule?: boolean }) {
  const palette = usePalette();
  const { t, formaterDate } = useI18n();
  const q = useNotes(livreId);
  const ajouter = useAjouterNote(livreId);
  const supprimer = useSupprimerNote(livreId);
  const [texte, setTexte] = useState('');

  const soumettre = () => {
    const contenu = texte.trim();
    if (!contenu) return;
    ajouter.mutate(contenu, { onSuccess: () => setTexte('') });
  };

  return (
    <View style={styles.section} testID="section-notes">
      <Texte variante="sousTitre">{t('notes.titre')}</Texte>

      {lectureSeule ? null : (
        <Carte style={styles.saisie}>
          <Texte variante="legende" couleur="texteSecondaire">
            {t('notes.champ')}
          </Texte>
          <TextInput
            value={texte}
            onChangeText={setTexte}
            placeholder={t('notes.placeholder')}
            placeholderTextColor={palette.texteSecondaire}
            multiline
            accessibilityLabel={t('notes.champ')}
            style={[
              styles.zone,
              { color: palette.texte, backgroundColor: palette.surfaceHaute, borderColor: palette.bordure },
            ]}
          />
          <Bouton
            titre={t('notes.ajouter')}
            onPress={soumettre}
            enCours={ajouter.isPending}
            desactive={texte.trim().length === 0}
            icone="ajouter"
          />
        </Carte>
      )}

      {q.isLoading ? (
        <View style={styles.chargement}>
          <Squelette hauteur={44} />
          <Squelette hauteur={44} />
        </View>
      ) : q.isError ? (
        <EtatErreur
          titre={t('etats.erreurTitre')}
          message={q.error instanceof Error ? q.error.message : undefined}
          libelleReessai={t('actions.reessayer')}
          onReessayer={() => q.refetch()}
        />
      ) : (q.data?.length ?? 0) === 0 ? (
        <EtatVide titre={t('etats.videTitre')} message={t('etats.notesVide')} />
      ) : (
        <View style={styles.liste}>
          {q.data?.map((note: Note) => (
            <Carte key={note.id} style={styles.note}>
              <Texte>{note.contenu}</Texte>
              <View style={styles.pied}>
                <Texte variante="legende" couleur="texteSecondaire">
                  {formaterDate(note.createdAt)}
                </Texte>
                {lectureSeule ? null : (
                  <Bouton
                    titre={t('actions.supprimer')}
                    onPress={() => supprimer.mutate(note.id)}
                    variante="fantome"
                    style={styles.suppr}
                    icone="supprimer"
                  />
                )}
              </View>
            </Carte>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: espacements.md },
  saisie: { gap: espacements.sm },
  zone: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: rayons.md,
    padding: espacements.md,
    fontSize: typographie.corps.taille,
    lineHeight: typographie.corps.hauteur,
    textAlignVertical: 'top',
  },
  chargement: { gap: espacements.sm },
  liste: { gap: espacements.sm },
  note: { gap: espacements.sm },
  pied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suppr: { minHeight: CIBLE_TACTILE, paddingHorizontal: espacements.sm },
});
