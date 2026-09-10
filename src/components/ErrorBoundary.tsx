/**
 * ErrorBoundary global (§3.3) : affiche un écran exploitable plutôt qu'un écran
 * blanc, avec possibilité de réessayer. Ne journalise pas de données sensibles.
 */
import { espacements } from '@/theme/tokens';
import { Component, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Bouton } from './Bouton';
import { Texte } from './Texte';

type Props = { children: ReactNode };
type State = { erreur: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erreur: null };

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur };
  }

  componentDidCatch(erreur: Error): void {
    // Journalisation structurée minimale (message seulement, pas de données).
    console.error('[ErrorBoundary]', erreur.message);
  }

  private reinitialiser = () => this.setState({ erreur: null });

  render() {
    if (!this.state.erreur) return this.props.children;
    return (
      <View style={styles.centre}>
        <Texte variante="titre" couleur="danger">
          Une erreur inattendue est survenue
        </Texte>
        <Texte couleur="texteSecondaire" style={styles.message}>
          {this.state.erreur.message}
        </Texte>
        <Bouton titre="Réessayer" onPress={this.reinitialiser} style={styles.action} icone="rafraichir" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacements.xl,
    gap: espacements.md,
  },
  message: { textAlign: 'center' },
  action: { minWidth: 160 },
});
