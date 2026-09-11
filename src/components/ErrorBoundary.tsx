/**
 * ErrorBoundary global (§3.3) : affiche un écran exploitable plutôt qu'un écran
 * blanc, avec possibilité de réessayer. Ne journalise pas de données sensibles.
 *
 * Volontairement autonome vis-à-vis de l'arbre React (aucune dépendance à
 * FournisseurTheme/useI18n) : il enveloppe tout _layout.tsx,
 * PersistQueryClientProvider compris (BL-10), pour couvrir une erreur
 * survenant pendant l'initialisation d'un fournisseur — thème et i18n
 * inclus, potentiellement la source du problème. Le texte est donc en dur
 * en français (langue de repli du sujet), et la palette vient de
 * useColorScheme() de react-native (natif, sans fournisseur) plutôt que de
 * la palette de l'application. services/journal.ts (§ Lot 5) reste sûr à
 * importer ici : il ne dépend d'aucun contexte React, seulement de
 * services/stockage.ts.
 */
import { consigner } from '@/services/journal';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

type Props = { children: ReactNode };
type State = { erreur: Error | null };

const PALETTES = {
  clair: { fond: '#FFFFFF', texte: '#1A1A1A', texteSecondaire: '#5A5A5A', danger: '#B3261E', bouton: '#1A1A1A', boutonTexte: '#FFFFFF' },
  sombre: { fond: '#121212', texte: '#F2F2F2', texteSecondaire: '#B5B5B5', danger: '#F2B8B5', bouton: '#F2F2F2', boutonTexte: '#121212' },
};

function Secours({ message, onReessayer }: { message: string; onReessayer: () => void }) {
  const p = useColorScheme() === 'dark' ? PALETTES.sombre : PALETTES.clair;
  return (
    <View style={[styles.centre, { backgroundColor: p.fond }]}>
      <Text style={[styles.titre, { color: p.danger }]}>Une erreur inattendue est survenue</Text>
      <Text style={[styles.message, { color: p.texteSecondaire }]}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Réessayer"
        onPress={onReessayer}
        style={[styles.bouton, { backgroundColor: p.bouton }]}
      >
        <Text style={[styles.boutonTexte, { color: p.boutonTexte }]}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erreur: null };

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur };
  }

  componentDidCatch(erreur: Error, info: ErrorInfo): void {
    // §Lot 5 : passe par le service de journalisation plutôt qu'un
    // console.error ad hoc — consigner() écrit déjà vers la console (niveau
    // erreur) et persiste l'entrée pour l'écran Journal. La pile de
    // composants aide à localiser le fournisseur en cause sans données
    // utilisateur (aucun contenu de note/champ saisi n'y figure jamais).
    consigner('erreur', 'Erreur interceptée par ErrorBoundary', {
      erreur,
      contexte: { pileComposants: info.componentStack },
    });
  }

  private reinitialiser = () => this.setState({ erreur: null });

  render() {
    if (!this.state.erreur) return this.props.children;
    return <Secours message={this.state.erreur.message} onReessayer={this.reinitialiser} />;
  }
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  titre: { fontSize: 18, fontWeight: '700' },
  message: { fontSize: 14, textAlign: 'center' },
  bouton: { minWidth: 160, minHeight: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  boutonTexte: { fontSize: 14, fontWeight: '600' },
});
