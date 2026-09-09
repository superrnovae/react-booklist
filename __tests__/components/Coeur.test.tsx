import { fireEvent } from '@testing-library/react-native';
import { Coeur } from '@/components/Coeur';
import { rendreAvecTheme, screen } from '../utils/rendu';

describe('<Coeur />', () => {
  it('reflète l\'état actif via accessibilityState.checked', async () => {
    await rendreAvecTheme(<Coeur actif onToggle={() => {}} libelle="Coup de cœur" />);
    expect(screen.getByRole('switch').props.accessibilityState.checked).toBe(true);
  });

  it('déclenche onToggle au clic', async () => {
    const onToggle = jest.fn();
    await rendreAvecTheme(<Coeur actif={false} onToggle={onToggle} libelle="Coup de cœur" />);
    fireEvent.press(screen.getByLabelText('Coup de cœur'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
