import { fireEvent } from '@testing-library/react-native';
import { Bouton } from '@/components/Bouton';
import { rendreAvecTheme, screen } from '../utils/rendu';

describe('<Bouton />', () => {
  it('affiche le titre et déclenche onPress', async () => {
    const onPress = jest.fn();
    await rendreAvecTheme(<Bouton titre="Enregistrer" onPress={onPress} />);
    fireEvent.press(screen.getByText('Enregistrer'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ne déclenche pas onPress pendant l\'envoi', async () => {
    const onPress = jest.fn();
    await rendreAvecTheme(<Bouton titre="Envoyer" onPress={onPress} enCours />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('expose l\'état désactivé pour l\'accessibilité', async () => {
    await rendreAvecTheme(<Bouton titre="X" onPress={() => {}} desactive />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
